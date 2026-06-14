package com.ringochi.adminservice;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

public final class AdminClients {
    private AdminClients() {
    }

    @FeignClient(name = "user-service", contextId = "adminUserClient")
    public interface UserClient {
        @GetMapping("/api/users")
        List<Map<String, Object>> all(@RequestHeader("X-User-Roles") String roles,
                                      @RequestParam(required = false) String q,
                                      @RequestParam(required = false) String role,
                                      @RequestParam(required = false) Boolean enabled,
                                      @RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "50") int size);

        @GetMapping("/api/users/{id}")
        Map<String, Object> byId(@PathVariable UUID id);

        @PatchMapping("/api/admin/users/{id}/roles")
        Map<String, Object> updateRoles(@RequestHeader("X-User-Roles") String roles,
                                        @PathVariable UUID id,
                                        @RequestBody AdminController.UpdateRolesRequest request);

        @PatchMapping("/api/admin/users/{id}/enabled")
        Map<String, Object> updateEnabled(@RequestHeader("X-User-Roles") String roles,
                                          @PathVariable UUID id,
                                          @RequestBody AdminController.UpdateEnabledRequest request);
    }

    @FeignClient(name = "route-service", contextId = "adminRouteClient")
    public interface RouteClient {
        @GetMapping("/api/cities")
        List<Map<String, Object>> cities();

        @GetMapping("/api/cities/{id}")
        Map<String, Object> city(@PathVariable UUID id);

        @DeleteMapping("/api/cities/{id}")
        void deleteCity(@RequestHeader("X-User-Roles") String roles, @PathVariable UUID id);

        @GetMapping("/api/routes")
        List<Map<String, Object>> routes();

        @GetMapping("/api/routes/{id}")
        Map<String, Object> route(@PathVariable UUID id);

        @DeleteMapping("/api/routes/{id}")
        void deleteRoute(@RequestHeader("X-User-Roles") String roles, @PathVariable UUID id);
    }

    @FeignClient(name = "trip-service", contextId = "adminTripClient")
    public interface TripClient {
        @GetMapping("/api/trips")
        List<Map<String, Object>> all(@RequestParam(required = false) String status,
                                      @RequestParam(required = false) UUID routeId,
                                      @RequestParam(required = false) UUID driverId,
                                      @RequestParam(required = false) String dateFrom,
                                      @RequestParam(required = false) String dateTo,
                                      @RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "50") int size);

        @GetMapping("/api/trips/{id}")
        Map<String, Object> byId(@PathVariable UUID id);

        @PostMapping("/api/trips")
        Map<String, Object> create(@RequestHeader("X-User-Roles") String roles, @RequestBody Map<String, Object> request);

        @PatchMapping("/api/trips/{id}")
        Map<String, Object> update(@RequestHeader("X-User-Roles") String roles, @PathVariable UUID id,
                                   @RequestBody Map<String, Object> request);

        @DeleteMapping("/api/trips/{id}")
        Map<String, Object> cancel(@RequestHeader("X-User-Roles") String roles, @PathVariable UUID id);
    }

    @FeignClient(name = "booking-service", contextId = "adminBookingClient")
    public interface BookingClient {
        @GetMapping("/api/bookings/admin")
        List<Map<String, Object>> all(@RequestHeader("X-User-Roles") String roles,
                                      @RequestParam(required = false) String status,
                                      @RequestParam(required = false) UUID userId,
                                      @RequestParam(required = false) UUID tripId,
                                      @RequestParam(required = false) UUID paymentId,
                                      @RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "50") int size);

        @GetMapping("/api/bookings/admin/{id}")
        Map<String, Object> byId(@RequestHeader("X-User-Roles") String roles, @PathVariable UUID id);

        @PostMapping("/api/bookings/admin/{id}/cancel")
        Map<String, Object> cancel(@RequestHeader("X-User-Roles") String roles, @PathVariable UUID id);
    }

    @FeignClient(name = "payment-service", contextId = "adminPaymentClient")
    public interface PaymentClient {
        @GetMapping("/api/payments")
        List<Map<String, Object>> all(@RequestParam(required = false) String status,
                                      @RequestParam(required = false) String targetType,
                                      @RequestParam(required = false) UUID targetId,
                                      @RequestParam(required = false) UUID userId,
                                      @RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "50") int size);

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
        List<Map<String, Object>> all(@RequestHeader("X-User-Roles") String roles,
                                      @RequestParam(required = false) String status,
                                      @RequestParam(required = false) UUID tripId,
                                      @RequestParam(required = false) UUID userId,
                                      @RequestParam(required = false) UUID paymentId,
                                      @RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "50") int size);

        @GetMapping("/api/cargo-orders/admin/{id}")
        Map<String, Object> byId(@RequestHeader("X-User-Roles") String roles, @PathVariable UUID id);

        @PostMapping("/api/cargo-orders/admin/{id}/cancel")
        Map<String, Object> cancel(@RequestHeader("X-User-Roles") String roles, @PathVariable UUID id);

        @GetMapping("/api/cargo-orders/trips/{tripId}/capacity")
        Map<String, Object> capacity(@RequestHeader("X-User-Roles") String roles, @PathVariable UUID tripId);
    }
}
