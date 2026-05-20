package com.ringochi.bookingservice;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

@FeignClient(name = "trip-service")
public interface TripClient {
    @GetMapping("/api/trips/{id}")
    TripDto getTrip(@PathVariable("id") UUID id);

    @PostMapping("/api/trips/{id}/reserve-seat")
    TripDto reserveSeat(@PathVariable("id") UUID id);

    @PostMapping("/api/trips/{id}/release-seat")
    TripDto releaseSeat(@PathVariable("id") UUID id);

    record TripDto(UUID id, UUID routeId, Instant departureTime, Instant arrivalTime, int totalSeats,
                   int availableSeats, BigDecimal price, String status) {}
}
