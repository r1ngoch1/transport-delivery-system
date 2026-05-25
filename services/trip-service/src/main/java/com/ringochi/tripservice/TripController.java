package com.ringochi.tripservice;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/trips")
public class TripController {
    private final TripRepository trips;
    private final RouteClient routeClient;
    private final DriverClient driverClient;

    public TripController(TripRepository trips, RouteClient routeClient, DriverClient driverClient) {
        this.trips = trips;
        this.routeClient = routeClient;
        this.driverClient = driverClient;
    }

    @GetMapping
    public List<Trip> all(@RequestParam(required = false) TripStatus status,
                          @RequestParam(required = false) UUID routeId,
                          @RequestParam(required = false) UUID driverId,
                          @RequestParam(required = false) java.time.Instant dateFrom,
                          @RequestParam(required = false) java.time.Instant dateTo,
                          @RequestParam(defaultValue = "0") int page,
                          @RequestParam(defaultValue = "50") int size) {
        var pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.ASC, "departureTime"));
        return trips.findAll(tripSpec(status, routeId, driverId, dateFrom, dateTo), pageable).getContent();
    }

    @GetMapping("/{id}")
    public Trip byId(@PathVariable UUID id) {
        return trips.findById(id).orElseThrow(() -> notFound("Trip not found"));
    }

    @GetMapping("/search")
    public List<Trip> search(UUID routeId, LocalDate date) {
        if (date == null) {
            return trips.findByRouteId(routeId);
        }
        var from = date.atStartOfDay().toInstant(ZoneOffset.UTC);
        return trips.search(routeId, from, from.plusSeconds(86_400));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Trip create(@RequestHeader(value = "X-User-Id", required = false) UUID userId,
                       @RequestHeader(value = "X-User-Roles", required = false) String roles,
                       @RequestBody Trip trip) {
        UUID driverId = resolveDriverIdForCreate(userId, roles, trip);
        routeClient.getRoute(trip.getRouteId());
        ensureDriverHasNoScheduleConflict(driverId, trip.getDepartureTime(), trip.getArrivalTime(), trip.getId());
        if (trip.getAvailableSeats() == 0) {
            trip.setAvailableSeats(trip.getTotalSeats());
        }
        if (trip.getAvailableCargoVolume() == 0) {
            trip.setAvailableCargoVolume(trip.getTotalCargoVolume());
        }
        return trips.save(trip);
    }

    @PatchMapping("/{id}")
    public Trip update(@RequestHeader(value = "X-User-Roles", required = false) String roles, @PathVariable UUID id,
                       @RequestBody Trip request) {
        requireAdmin(roles);
        Trip trip = byId(id);
        if (request.getStatus() != null) trip.setStatus(request.getStatus());
        if (request.getDriverId() != null) {
            requireAvailableDriver(request.getDriverId());
            ensureDriverHasNoScheduleConflict(request.getDriverId(), trip.getDepartureTime(), trip.getArrivalTime(), trip.getId());
            trip.setDriverId(request.getDriverId());
        }
        return trips.save(trip);
    }

    public Trip create(String roles, Trip trip) {
        return create(null, roles, trip);
    }

    @DeleteMapping("/{id}")
    public Trip cancel(@RequestHeader(value = "X-User-Roles", required = false) String roles, @PathVariable UUID id) {
        requireAdmin(roles);
        Trip trip = byId(id);
        trip.setStatus(TripStatus.CANCELLED);
        return trips.save(trip);
    }

    @Transactional
    @PostMapping("/{id}/reserve-seat")
    public Trip reserveSeat(@PathVariable UUID id) {
        Trip trip = trips.findLocked(id).orElseThrow(() -> notFound("Trip not found"));
        if (trip.getStatus() != TripStatus.SCHEDULED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Trip is not available for booking");
        }
        if (trip.getAvailableSeats() <= 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No available seats");
        }
        trip.setAvailableSeats(trip.getAvailableSeats() - 1);
        return trips.save(trip);
    }

    @Transactional
    @PostMapping("/{id}/release-seat")
    public Trip releaseSeat(@PathVariable UUID id) {
        Trip trip = trips.findLocked(id).orElseThrow(() -> notFound("Trip not found"));
        if (trip.getAvailableSeats() < trip.getTotalSeats()) {
            trip.setAvailableSeats(trip.getAvailableSeats() + 1);
        }
        return trips.save(trip);
    }

    private ResponseStatusException notFound(String message) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, message);
    }

    private void requireAvailableDriver(UUID driverId) {
        if (driverId == null) {
            return;
        }
        DriverClient.DriverDto driver = driverClient.getDriver(driverId);
        requireAvailableDriver(driver);
    }

    private void requireAvailableDriver(DriverClient.DriverDto driver) {
        if (!driver.active() || driver.availabilityStatus() != DriverClient.AvailabilityStatus.AVAILABLE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Driver is not available");
        }
    }

    private UUID resolveDriverIdForCreate(UUID userId, String roles, Trip trip) {
        if (roles != null && roles.contains("ADMIN")) {
            requireAvailableDriver(trip.getDriverId());
            return trip.getDriverId();
        }
        if (roles != null && roles.contains("DRIVER")) {
            if (userId == null) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing user id");
            }
            DriverClient.DriverDto driver = driverClient.getCurrentDriver(userId);
            requireAvailableDriver(driver);
            trip.setDriverId(driver.id());
            return driver.id();
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ADMIN or DRIVER role required");
    }

    private void ensureDriverHasNoScheduleConflict(UUID driverId, java.time.Instant departureTime,
                                                   java.time.Instant arrivalTime, UUID excludedTripId) {
        if (driverId == null || departureTime == null || arrivalTime == null) {
            return;
        }
        if (!trips.findDriverScheduleConflicts(driverId, departureTime, arrivalTime, excludedTripId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Driver is already assigned to another trip");
        }
    }

    private void requireAdmin(String roles) {
        if (roles == null || !roles.contains("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ADMIN role required");
        }
    }

    private Specification<Trip> tripSpec(TripStatus status, UUID routeId, UUID driverId,
                                         java.time.Instant dateFrom, java.time.Instant dateTo) {
        return (root, query, cb) -> {
            var predicate = cb.conjunction();
            if (status != null) {
                predicate = cb.and(predicate, cb.equal(root.get("status"), status));
            }
            if (routeId != null) {
                predicate = cb.and(predicate, cb.equal(root.get("routeId"), routeId));
            }
            if (driverId != null) {
                predicate = cb.and(predicate, cb.equal(root.get("driverId"), driverId));
            }
            if (dateFrom != null) {
                predicate = cb.and(predicate, cb.greaterThanOrEqualTo(root.get("departureTime"), dateFrom));
            }
            if (dateTo != null) {
                predicate = cb.and(predicate, cb.lessThanOrEqualTo(root.get("departureTime"), dateTo));
            }
            return predicate;
        };
    }
}
