package com.ringochi.tripservice;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
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
    public List<Trip> all() {
        return trips.findAll();
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
    public Trip create(@RequestHeader(value = "X-User-Roles", required = false) String roles, @RequestBody Trip trip) {
        requireAdmin(roles);
        routeClient.getRoute(trip.getRouteId());
        requireAvailableDriver(trip.getDriverId());
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
            trip.setDriverId(request.getDriverId());
        }
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
        if (!driver.active() || driver.availabilityStatus() != DriverClient.AvailabilityStatus.AVAILABLE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Driver is not available");
        }
    }

    private void requireAdmin(String roles) {
        if (roles == null || !roles.contains("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ADMIN role required");
        }
    }
}
