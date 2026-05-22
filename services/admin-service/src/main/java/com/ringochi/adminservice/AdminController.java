package com.ringochi.adminservice;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private static final String ADMIN_ROLE = "ADMIN";

    private final AdminClients.UserClient users;
    private final AdminClients.RouteClient routes;
    private final AdminClients.TripClient trips;
    private final AdminClients.BookingClient bookings;
    private final AdminClients.PaymentClient payments;
    private final AdminClients.DriverClient drivers;
    private final AdminClients.CargoClient cargo;
    private final AdminAuditLogger auditLogger;

    public AdminController(AdminClients.UserClient users, AdminClients.RouteClient routes, AdminClients.TripClient trips,
                           AdminClients.BookingClient bookings, AdminClients.PaymentClient payments,
                           AdminClients.DriverClient drivers, AdminClients.CargoClient cargo,
                           AdminAuditLogger auditLogger) {
        this.users = users;
        this.routes = routes;
        this.trips = trips;
        this.bookings = bookings;
        this.payments = payments;
        this.drivers = drivers;
        this.cargo = cargo;
        this.auditLogger = auditLogger;
    }

    @GetMapping("/users")
    public List<Map<String, Object>> users(@RequestHeader("X-User-Id") UUID adminUserId,
                                           @RequestHeader(value = "X-User-Roles", required = false) String roles) {
        requireAdmin(roles);
        List<Map<String, Object>> result = users.all(ADMIN_ROLE);
        audit(adminUserId, "LIST", "USER", null);
        return result;
    }

    @GetMapping("/users/{id}")
    public Map<String, Object> user(@RequestHeader("X-User-Id") UUID adminUserId,
                                    @RequestHeader(value = "X-User-Roles", required = false) String roles,
                                    @PathVariable UUID id) {
        requireAdmin(roles);
        Map<String, Object> result = users.byId(id);
        audit(adminUserId, "GET", "USER", id);
        return result;
    }

    @GetMapping("/cities")
    public List<Map<String, Object>> cities(@RequestHeader("X-User-Id") UUID adminUserId,
                                            @RequestHeader(value = "X-User-Roles", required = false) String roles) {
        requireAdmin(roles);
        List<Map<String, Object>> result = routes.cities();
        audit(adminUserId, "LIST", "CITY", null);
        return result;
    }

    @GetMapping("/routes")
    public List<Map<String, Object>> routes(@RequestHeader("X-User-Id") UUID adminUserId,
                                            @RequestHeader(value = "X-User-Roles", required = false) String roles) {
        requireAdmin(roles);
        List<Map<String, Object>> result = routes.routes();
        audit(adminUserId, "LIST", "ROUTE", null);
        return result;
    }

    @GetMapping("/trips")
    public List<Map<String, Object>> trips(@RequestHeader("X-User-Id") UUID adminUserId,
                                           @RequestHeader(value = "X-User-Roles", required = false) String roles,
                                           @RequestParam(required = false) UUID routeId,
                                           @RequestParam(required = false) String date) {
        requireAdmin(roles);
        List<Map<String, Object>> result;
        if (routeId == null && date == null) {
            result = trips.list();
        } else {
            result = trips.all(routeId, date);
        }
        audit(adminUserId, "LIST", "TRIP", null);
        return result;
    }

    @GetMapping("/trips/{id}")
    public Map<String, Object> trip(@RequestHeader("X-User-Id") UUID adminUserId,
                                    @RequestHeader(value = "X-User-Roles", required = false) String roles,
                                    @PathVariable UUID id) {
        requireAdmin(roles);
        Map<String, Object> result = trips.byId(id);
        audit(adminUserId, "GET", "TRIP", id);
        return result;
    }

    @GetMapping("/bookings")
    public List<Map<String, Object>> bookings(@RequestHeader("X-User-Id") UUID adminUserId,
                                              @RequestHeader(value = "X-User-Roles", required = false) String roles) {
        requireAdmin(roles);
        List<Map<String, Object>> result = bookings.all(ADMIN_ROLE);
        audit(adminUserId, "LIST", "BOOKING", null);
        return result;
    }

    @GetMapping("/bookings/{id}")
    public Map<String, Object> booking(@RequestHeader("X-User-Id") UUID adminUserId,
                                       @RequestHeader(value = "X-User-Roles", required = false) String roles,
                                       @PathVariable UUID id) {
        requireAdmin(roles);
        Map<String, Object> result = bookings.byId(ADMIN_ROLE, id);
        audit(adminUserId, "GET", "BOOKING", id);
        return result;
    }

    @GetMapping("/payments")
    public List<Map<String, Object>> payments(@RequestHeader("X-User-Id") UUID adminUserId,
                                              @RequestHeader(value = "X-User-Roles", required = false) String roles,
                                              @RequestParam(required = false) String targetType,
                                              @RequestParam(required = false) UUID targetId) {
        requireAdmin(roles);
        List<Map<String, Object>> result = payments.all(targetType, targetId);
        audit(adminUserId, "LIST", "PAYMENT", null);
        return result;
    }

    @GetMapping("/payments/{id}")
    public Map<String, Object> payment(@RequestHeader("X-User-Id") UUID adminUserId,
                                       @RequestHeader(value = "X-User-Roles", required = false) String roles,
                                       @PathVariable UUID id) {
        requireAdmin(roles);
        Map<String, Object> result = payments.byId(id);
        audit(adminUserId, "GET", "PAYMENT", id);
        return result;
    }

    @GetMapping("/drivers")
    public List<Map<String, Object>> drivers(@RequestHeader("X-User-Id") UUID adminUserId,
                                             @RequestHeader(value = "X-User-Roles", required = false) String roles) {
        requireAdmin(roles);
        List<Map<String, Object>> result = drivers.all(ADMIN_ROLE);
        audit(adminUserId, "LIST", "DRIVER", null);
        return result;
    }

    @GetMapping("/drivers/{id}")
    public Map<String, Object> driver(@RequestHeader("X-User-Id") UUID adminUserId,
                                      @RequestHeader(value = "X-User-Roles", required = false) String roles,
                                      @PathVariable UUID id) {
        requireAdmin(roles);
        Map<String, Object> result = drivers.byId(ADMIN_ROLE, id);
        audit(adminUserId, "GET", "DRIVER", id);
        return result;
    }

    @GetMapping("/cargo-orders")
    public List<Map<String, Object>> cargoOrders(@RequestHeader("X-User-Id") UUID adminUserId,
                                                 @RequestHeader(value = "X-User-Roles", required = false) String roles) {
        requireAdmin(roles);
        List<Map<String, Object>> result = cargo.all(ADMIN_ROLE);
        audit(adminUserId, "LIST", "CARGO_ORDER", null);
        return result;
    }

    @GetMapping("/cargo-orders/{id}")
    public Map<String, Object> cargoOrder(@RequestHeader("X-User-Id") UUID adminUserId,
                                          @RequestHeader(value = "X-User-Roles", required = false) String roles,
                                          @PathVariable UUID id) {
        requireAdmin(roles);
        Map<String, Object> result = cargo.byId(ADMIN_ROLE, id);
        audit(adminUserId, "GET", "CARGO_ORDER", id);
        return result;
    }

    @GetMapping("/cargo-orders/trips/{tripId}/capacity")
    public Map<String, Object> cargoCapacity(@RequestHeader("X-User-Id") UUID adminUserId,
                                             @RequestHeader(value = "X-User-Roles", required = false) String roles,
                                             @PathVariable UUID tripId) {
        requireAdmin(roles);
        Map<String, Object> result = cargo.capacity(ADMIN_ROLE, tripId);
        audit(adminUserId, "GET", "CARGO_CAPACITY", tripId);
        return result;
    }

    private void requireAdmin(String roles) {
        if (roles == null || !roles.contains(ADMIN_ROLE)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ADMIN role required");
        }
    }

    private void audit(UUID adminUserId, String action, String resourceType, UUID resourceId) {
        auditLogger.log(adminUserId, action, resourceType, resourceId);
    }
}
