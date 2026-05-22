package com.ringochi.adminservice;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

public final class AdminClients {
    private AdminClients() {
    }

    @FeignClient(name = "user-service", contextId = "adminUserClient")
    public interface UserClient {
        @GetMapping("/api/users")
        List<Map<String, Object>> all(@RequestHeader("X-User-Roles") String roles);

        @GetMapping("/api/users/{id}")
        Map<String, Object> byId(@PathVariable UUID id);
    }

    @FeignClient(name = "route-service", contextId = "adminRouteClient")
    public interface RouteClient {
        @GetMapping("/api/cities")
        List<Map<String, Object>> cities();

        @GetMapping("/api/routes")
        List<Map<String, Object>> routes();
    }

    @FeignClient(name = "trip-service", contextId = "adminTripClient")
    public interface TripClient {
        @GetMapping("/api/trips")
        List<Map<String, Object>> list();

        @GetMapping("/api/trips/search")
        List<Map<String, Object>> all(@RequestParam(required = false) UUID routeId,
                                      @RequestParam(required = false) String date);

        @GetMapping("/api/trips/{id}")
        Map<String, Object> byId(@PathVariable UUID id);
    }

    @FeignClient(name = "booking-service", contextId = "adminBookingClient")
    public interface BookingClient {
        @GetMapping("/api/bookings/admin")
        List<Map<String, Object>> all(@RequestHeader("X-User-Roles") String roles);

        @GetMapping("/api/bookings/admin/{id}")
        Map<String, Object> byId(@RequestHeader("X-User-Roles") String roles, @PathVariable UUID id);
    }

    @FeignClient(name = "payment-service", contextId = "adminPaymentClient")
    public interface PaymentClient {
        @GetMapping("/api/payments")
        List<Map<String, Object>> all(@RequestParam(required = false) String targetType,
                                      @RequestParam(required = false) UUID targetId);

        @GetMapping("/api/payments/{id}")
        Map<String, Object> byId(@PathVariable UUID id);
    }

    @FeignClient(name = "driver-service", contextId = "adminDriverClient")
    public interface DriverClient {
        @GetMapping("/api/drivers")
        List<Map<String, Object>> all(@RequestHeader("X-User-Roles") String roles);

        @GetMapping("/api/drivers/{id}")
        Map<String, Object> byId(@RequestHeader("X-User-Roles") String roles, @PathVariable UUID id);
    }

    @FeignClient(name = "cargo-service", contextId = "adminCargoClient")
    public interface CargoClient {
        @GetMapping("/api/cargo-orders")
        List<Map<String, Object>> all(@RequestHeader("X-User-Roles") String roles);

        @GetMapping("/api/cargo-orders/admin/{id}")
        Map<String, Object> byId(@RequestHeader("X-User-Roles") String roles, @PathVariable UUID id);

        @GetMapping("/api/cargo-orders/trips/{tripId}/capacity")
        Map<String, Object> capacity(@RequestHeader("X-User-Roles") String roles, @PathVariable UUID tripId);
    }
}
