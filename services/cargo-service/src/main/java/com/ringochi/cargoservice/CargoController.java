package com.ringochi.cargoservice;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/cargo-orders")
public class CargoController {
    private static final BigDecimal CUBIC_CENTIMETERS_PER_CUBIC_METER = new BigDecimal("1000000");

    private final CargoOrderRepository cargoOrders;
    private final PaymentClient paymentClient;
    private final CargoProperties properties;

    public CargoController(CargoOrderRepository cargoOrders, PaymentClient paymentClient, CargoProperties properties) {
        this.cargoOrders = cargoOrders;
        this.paymentClient = paymentClient;
        this.properties = properties;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CargoOrder create(@RequestHeader("X-User-Id") UUID userId, @RequestBody CargoOrder request) {
        validateDimensions(request);
        request.setUserId(userId);
        request.setVolumeM3(calculateVolume(request));
        request.setPrice(calculatePrice(request));
        request.setCurrency(request.getCurrency() == null ? "RUB" : request.getCurrency());
        request.setStatus(CargoStatus.PENDING_PAYMENT);
        checkCapacity(request);

        try {
            var payment = paymentClient.create("cargo-order-" + request.getId(), new PaymentClient.CreatePaymentRequest(
                    "CARGO_ORDER", request.getId(), userId, request.getPrice(), request.getCurrency()));
            request.setPaymentId(payment.id());
            if ("SUCCESS".equals(payment.status())) {
                request.setStatus(CargoStatus.PAID);
            }
            touch(request);
            return cargoOrders.save(request);
        } catch (RuntimeException ex) {
            request.setStatus(CargoStatus.CANCELLED);
            touch(request);
            cargoOrders.save(request);
            throw ex;
        }
    }

    @GetMapping("/my")
    public List<CargoOrder> my(@RequestHeader("X-User-Id") UUID userId) {
        return cargoOrders.findByUserId(userId);
    }

    @GetMapping
    public List<CargoOrder> all(@RequestHeader(value = "X-User-Roles", required = false) String roles,
                                @RequestParam(required = false) CargoStatus status,
                                @RequestParam(required = false) UUID tripId,
                                @RequestParam(required = false) UUID userId,
                                @RequestParam(required = false) UUID paymentId,
                                @RequestParam(defaultValue = "0") int page,
                                @RequestParam(defaultValue = "50") int size) {
        requireAdmin(roles);
        var pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return cargoOrders.findAll(cargoSpec(status, tripId, userId, paymentId), pageable).getContent();
    }

    @GetMapping("/admin/{id}")
    public CargoOrder adminById(@RequestHeader(value = "X-User-Roles", required = false) String roles,
                                @PathVariable UUID id) {
        requireAdmin(roles);
        return cargoOrders.findById(id).orElseThrow(() -> notFound());
    }

    @GetMapping("/{id}")
    public CargoOrder byId(@RequestHeader("X-User-Id") UUID userId, @PathVariable UUID id) {
        CargoOrder order = cargoOrders.findById(id).orElseThrow(() -> notFound());
        if (!order.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot access another user's cargo order");
        }
        return order;
    }

    @PostMapping("/{id}/cancel")
    public CargoOrder cancel(@RequestHeader("X-User-Id") UUID userId, @PathVariable UUID id) {
        CargoOrder order = byId(userId, id);
        return cancelOrder(order);
    }

    @PostMapping("/admin/{id}/cancel")
    public CargoOrder adminCancel(@RequestHeader(value = "X-User-Roles", required = false) String roles,
                                  @PathVariable UUID id) {
        requireAdmin(roles);
        CargoOrder order = cargoOrders.findById(id).orElseThrow(() -> notFound());
        return cancelOrder(order);
    }

    private CargoOrder cancelOrder(CargoOrder order) {
        if (order.getStatus() != CargoStatus.CANCELLED) {
            order.setStatus(CargoStatus.CANCELLED);
            touch(order);
            return cargoOrders.save(order);
        }
        return order;
    }

    @GetMapping("/trips/{tripId}/capacity")
    public CargoCapacity capacity(@RequestHeader(value = "X-User-Roles", required = false) String roles,
                                  @PathVariable UUID tripId) {
        requireAdmin(roles);
        List<CargoOrder> activeOrders = cargoOrders.findByTripIdAndStatusIn(tripId, CargoStatus.activeStatuses());
        BigDecimal reservedWeight = sum(activeOrders, "weight");
        BigDecimal reservedVolume = sum(activeOrders, "volume");
        return new CargoCapacity(
                tripId,
                properties.maxWeightKg(),
                reservedWeight,
                properties.maxWeightKg().subtract(reservedWeight),
                properties.maxVolumeM3(),
                reservedVolume,
                properties.maxVolumeM3().subtract(reservedVolume));
    }

    private void validateDimensions(CargoOrder order) {
        if (!positive(order.getWeightKg()) || !positive(order.getLengthCm()) || !positive(order.getWidthCm())
                || !positive(order.getHeightCm())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cargo dimensions and weight must be positive");
        }
    }

    private boolean positive(BigDecimal value) {
        return value != null && value.compareTo(BigDecimal.ZERO) > 0;
    }

    private BigDecimal calculateVolume(CargoOrder order) {
        return order.getLengthCm()
                .multiply(order.getWidthCm())
                .multiply(order.getHeightCm())
                .divide(CUBIC_CENTIMETERS_PER_CUBIC_METER, 4, RoundingMode.HALF_UP);
    }

    private BigDecimal calculatePrice(CargoOrder order) {
        return properties.basePrice()
                .add(order.getWeightKg().multiply(properties.pricePerKg()))
                .add(order.getVolumeM3().multiply(properties.pricePerM3()))
                .setScale(2, RoundingMode.HALF_UP);
    }

    private void checkCapacity(CargoOrder order) {
        CargoCapacity capacity = capacityForTrip(order.getTripId());
        if (capacity.reservedWeightKg().add(order.getWeightKg()).compareTo(properties.maxWeightKg()) > 0
                || capacity.reservedVolumeM3().add(order.getVolumeM3()).compareTo(properties.maxVolumeM3()) > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cargo capacity exceeded for trip");
        }
    }

    private CargoCapacity capacityForTrip(UUID tripId) {
        List<CargoOrder> activeOrders = cargoOrders.findByTripIdAndStatusIn(tripId, CargoStatus.activeStatuses());
        BigDecimal reservedWeight = sum(activeOrders, "weight");
        BigDecimal reservedVolume = sum(activeOrders, "volume");
        return new CargoCapacity(
                tripId,
                properties.maxWeightKg(),
                reservedWeight,
                properties.maxWeightKg().subtract(reservedWeight),
                properties.maxVolumeM3(),
                reservedVolume,
                properties.maxVolumeM3().subtract(reservedVolume));
    }

    private BigDecimal sum(List<CargoOrder> orders, String field) {
        return orders.stream()
                .map(order -> "weight".equals(field) ? order.getWeightKg() : order.getVolumeM3())
                .filter(value -> value != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private void touch(CargoOrder order) {
        order.setUpdatedAt(Instant.now());
    }

    private ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Cargo order not found");
    }

    private void requireAdmin(String roles) {
        if (roles == null || !roles.contains("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ADMIN role required");
        }
    }

    private Specification<CargoOrder> cargoSpec(CargoStatus status, UUID tripId, UUID userId, UUID paymentId) {
        return (root, query, cb) -> {
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (tripId != null) {
                predicates.add(cb.equal(root.get("tripId"), tripId));
            }
            if (userId != null) {
                predicates.add(cb.equal(root.get("userId"), userId));
            }
            if (paymentId != null) {
                predicates.add(cb.equal(root.get("paymentId"), paymentId));
            }
            return cb.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
    }

    public record CargoCapacity(UUID tripId, BigDecimal maxWeightKg, BigDecimal reservedWeightKg,
                                BigDecimal availableWeightKg, BigDecimal maxVolumeM3, BigDecimal reservedVolumeM3,
                                BigDecimal availableVolumeM3) {
    }
}
