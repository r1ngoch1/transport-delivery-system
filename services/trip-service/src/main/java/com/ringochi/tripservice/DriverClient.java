package com.ringochi.tripservice;

import java.util.UUID;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "driver-service")
public interface DriverClient {
    @GetMapping("/api/drivers/{id}")
    DriverDto getDriver(@PathVariable("id") UUID id, @RequestHeader("X-User-Roles") String roles);

    @GetMapping("/api/drivers/me")
    DriverDto getCurrentDriver(@RequestHeader("X-User-Id") UUID userId,
                               @RequestHeader("X-User-Roles") String roles);

    default DriverDto getDriver(UUID id) {
        return getDriver(id, "ADMIN");
    }

    default DriverDto getCurrentDriver(UUID userId) {
        return getCurrentDriver(userId, "DRIVER");
    }

    record DriverDto(UUID id, UUID userId, String fullName, boolean active, AvailabilityStatus availabilityStatus) {}

    enum AvailabilityStatus {
        AVAILABLE,
        UNAVAILABLE,
        ON_TRIP,
        SUSPENDED
    }
}
