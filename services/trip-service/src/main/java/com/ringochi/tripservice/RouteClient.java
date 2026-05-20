package com.ringochi.tripservice;

import java.util.UUID;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "route-service")
public interface RouteClient {
    @GetMapping("/api/routes/{id}")
    RouteDto getRoute(@PathVariable("id") UUID id);

    record RouteDto(UUID id, UUID fromCityId, UUID toCityId, int distanceKm, int estimatedDurationMinutes, boolean active) {}
}
