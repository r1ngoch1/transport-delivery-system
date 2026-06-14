package com.ringochi.adminservice;

import java.time.Instant;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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
    private final AdminAuditEventRepository auditEvents;

    public AdminController(AdminClients.UserClient users, AdminClients.RouteClient routes, AdminClients.TripClient trips,
                           AdminClients.BookingClient bookings, AdminClients.PaymentClient payments,
                           AdminClients.DriverClient drivers, AdminClients.CargoClient cargo,
                           AdminAuditLogger auditLogger, AdminAuditEventRepository auditEvents) {
        this.users = users;
        this.routes = routes;
        this.trips = trips;
        this.bookings = bookings;
        this.payments = payments;
        this.drivers = drivers;
        this.cargo = cargo;
        this.auditLogger = auditLogger;
        this.auditEvents = auditEvents;
    }

    @GetMapping("/summary")
    public Map<String, Long> summary(@RequestHeader("X-User-Id") UUID adminUserId,
                                     @RequestHeader(value = "X-User-Roles", required = false) String roles) {
        requireAdmin(roles);
        Map<String, Long> result = Map.of(
                "users", (long) users.all(ADMIN_ROLE, null, null, null, 0, 50).size(),
                "cities", (long) routes.cities().size(),
                "routes", (long) routes.routes().size(),
                "trips", (long) trips.all(null, null, null, null, null, 0, 50).size(),
                "bookings", (long) bookings.all(ADMIN_ROLE, null, null, null, null, 0, 50).size(),
                "payments", (long) payments.all(null, null, null, null, 0, 50).size(),
                "cargoOrders", (long) cargo.all(ADMIN_ROLE, null, null, null, null, 0, 50).size(),
                "auditEvents", auditEvents.count()
        );
        audit(adminUserId, "GET", "SUMMARY", null);
        return result;
    }

    @GetMapping("/audit-events")
    public List<AdminAuditEvent> auditEvents(@RequestHeader("X-User-Id") UUID adminUserId,
                                             @RequestHeader(value = "X-User-Roles", required = false) String roles,
                                             @RequestParam(required = false) UUID actorId,
                                             @RequestParam(required = false) String action,
                                             @RequestParam(required = false) String resourceType,
                                             @RequestParam(required = false) UUID resourceId,
                                             @RequestParam(required = false) Instant from,
                                             @RequestParam(required = false) Instant to,
                                             @RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "50") int size) {
        requireAdmin(roles);
        var pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        List<AdminAuditEvent> result = auditEvents.findAll(
                auditSpec(actorId, action, resourceType, resourceId, from, to), pageable).getContent();
        audit(adminUserId, "LIST", "AUDIT_EVENT", null);
        return result;
    }

    @GetMapping("/audit-events/{id}")
    public AdminAuditEvent auditEvent(@RequestHeader("X-User-Id") UUID adminUserId,
                                      @RequestHeader(value = "X-User-Roles", required = false) String roles,
                                      @PathVariable UUID id) {
        requireAdmin(roles);
        AdminAuditEvent result = auditEvents.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Audit event not found"));
        audit(adminUserId, "GET", "AUDIT_EVENT", id);
        return result;
    }

    @GetMapping("/users")
    public List<Map<String, Object>> users(@RequestHeader("X-User-Id") UUID adminUserId,
                                           @RequestHeader(value = "X-User-Roles", required = false) String roles,
                                           @RequestParam(required = false) String q,
                                           @RequestParam(required = false) String role,
                                           @RequestParam(required = false) Boolean enabled,
                                           @RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "50") int size) {
        requireAdmin(roles);
        List<Map<String, Object>> result = users.all(ADMIN_ROLE, q, role, enabled, page, size);
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

    @PatchMapping("/users/{id}/roles")
    public Map<String, Object> updateUserRoles(@RequestHeader("X-User-Id") UUID adminUserId,
                                               @RequestHeader(value = "X-User-Roles", required = false) String roles,
                                               @PathVariable UUID id,
                                               @RequestBody UpdateRolesRequest request) {
        requireAdmin(roles);
        Map<String, Object> result = users.updateRoles(ADMIN_ROLE, id, request);
        audit(adminUserId, "UPDATE_ROLES", "USER", id);
        return result;
    }

    @PatchMapping("/users/{id}/enabled")
    public Map<String, Object> updateUserEnabled(@RequestHeader("X-User-Id") UUID adminUserId,
                                                 @RequestHeader(value = "X-User-Roles", required = false) String roles,
                                                 @PathVariable UUID id,
                                                 @RequestBody UpdateEnabledRequest request) {
        requireAdmin(roles);
        Map<String, Object> result = users.updateEnabled(ADMIN_ROLE, id, request);
        audit(adminUserId, "UPDATE_ENABLED", "USER", id);
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

    @GetMapping("/cities/{id}")
    public Map<String, Object> city(@RequestHeader("X-User-Id") UUID adminUserId,
                                    @RequestHeader(value = "X-User-Roles", required = false) String roles,
                                    @PathVariable UUID id) {
        requireAdmin(roles);
        Map<String, Object> result = routes.city(id);
        audit(adminUserId, "GET", "CITY", id);
        return result;
    }

    @DeleteMapping("/cities/{id}")
    public void deleteCity(@RequestHeader("X-User-Id") UUID adminUserId,
                           @RequestHeader(value = "X-User-Roles", required = false) String roles,
                           @PathVariable UUID id) {
        requireAdmin(roles);
        routes.deleteCity(ADMIN_ROLE, id);
        audit(adminUserId, "DELETE", "CITY", id);
    }

    @GetMapping("/routes")
    public List<Map<String, Object>> routes(@RequestHeader("X-User-Id") UUID adminUserId,
                                            @RequestHeader(value = "X-User-Roles", required = false) String roles) {
        requireAdmin(roles);
        List<Map<String, Object>> result = routes.routes();
        audit(adminUserId, "LIST", "ROUTE", null);
        return result;
    }

    @GetMapping("/routes/{id}")
    public Map<String, Object> route(@RequestHeader("X-User-Id") UUID adminUserId,
                                     @RequestHeader(value = "X-User-Roles", required = false) String roles,
                                     @PathVariable UUID id) {
        requireAdmin(roles);
        Map<String, Object> result = routes.route(id);
        audit(adminUserId, "GET", "ROUTE", id);
        return result;
    }

    @DeleteMapping("/routes/{id}")
    public void deleteRoute(@RequestHeader("X-User-Id") UUID adminUserId,
                            @RequestHeader(value = "X-User-Roles", required = false) String roles,
                            @PathVariable UUID id) {
        requireAdmin(roles);
        if (!trips.all(null, id, null, null, null, 0, 50).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Route is used by a trip");
        }
        routes.deleteRoute(ADMIN_ROLE, id);
        audit(adminUserId, "DELETE", "ROUTE", id);
    }

    @GetMapping("/trips")
    public List<Map<String, Object>> trips(@RequestHeader("X-User-Id") UUID adminUserId,
                                           @RequestHeader(value = "X-User-Roles", required = false) String roles,
                                           @RequestParam(required = false) String status,
                                           @RequestParam(required = false) UUID routeId,
                                           @RequestParam(required = false) UUID driverId,
                                           @RequestParam(required = false) String dateFrom,
                                           @RequestParam(required = false) String dateTo,
                                           @RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "50") int size) {
        requireAdmin(roles);
        List<Map<String, Object>> result = trips.all(status, routeId, driverId, dateFrom, dateTo, page, size);
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

    @PostMapping("/trips")
    public Map<String, Object> createTrip(@RequestHeader("X-User-Id") UUID adminUserId,
                                          @RequestHeader(value = "X-User-Roles", required = false) String roles,
                                          @RequestBody Map<String, Object> request) {
        requireAdmin(roles);
        Map<String, Object> result = trips.create(ADMIN_ROLE, request);
        audit(adminUserId, "CREATE", "TRIP", null);
        return result;
    }

    @PatchMapping("/trips/{id}")
    public Map<String, Object> updateTrip(@RequestHeader("X-User-Id") UUID adminUserId,
                                          @RequestHeader(value = "X-User-Roles", required = false) String roles,
                                          @PathVariable UUID id,
                                          @RequestBody Map<String, Object> request) {
        requireAdmin(roles);
        Map<String, Object> result = trips.update(ADMIN_ROLE, id, request);
        audit(adminUserId, "UPDATE", "TRIP", id);
        return result;
    }

    @DeleteMapping("/trips/{id}")
    public Map<String, Object> cancelTrip(@RequestHeader("X-User-Id") UUID adminUserId,
                                          @RequestHeader(value = "X-User-Roles", required = false) String roles,
                                          @PathVariable UUID id) {
        requireAdmin(roles);
        Map<String, Object> result = trips.cancel(ADMIN_ROLE, id);
        audit(adminUserId, "CANCEL", "TRIP", id);
        return result;
    }

    @GetMapping("/bookings")
    public List<Map<String, Object>> bookings(@RequestHeader("X-User-Id") UUID adminUserId,
                                              @RequestHeader(value = "X-User-Roles", required = false) String roles,
                                              @RequestParam(required = false) String status,
                                              @RequestParam(required = false) UUID userId,
                                              @RequestParam(required = false) UUID tripId,
                                              @RequestParam(required = false) UUID paymentId,
                                              @RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "50") int size) {
        requireAdmin(roles);
        List<Map<String, Object>> result = bookings.all(ADMIN_ROLE, status, userId, tripId, paymentId, page, size);
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

    @PostMapping("/bookings/{id}/cancel")
    public Map<String, Object> cancelBooking(@RequestHeader("X-User-Id") UUID adminUserId,
                                             @RequestHeader(value = "X-User-Roles", required = false) String roles,
                                             @PathVariable UUID id) {
        requireAdmin(roles);
        Map<String, Object> result = bookings.cancel(ADMIN_ROLE, id);
        audit(adminUserId, "CANCEL", "BOOKING", id);
        return result;
    }

    @GetMapping("/payments")
    public List<Map<String, Object>> payments(@RequestHeader("X-User-Id") UUID adminUserId,
                                              @RequestHeader(value = "X-User-Roles", required = false) String roles,
                                              @RequestParam(required = false) String status,
                                              @RequestParam(required = false) String targetType,
                                              @RequestParam(required = false) UUID targetId,
                                              @RequestParam(required = false) UUID userId,
                                              @RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "50") int size) {
        requireAdmin(roles);
        List<Map<String, Object>> result = payments.all(status, targetType, targetId, userId, page, size);
        audit(adminUserId, "LIST", "PAYMENT", null);
        return result;
    }

    @GetMapping("/payments/{id}")
    public Map<String, Object> payment(@RequestHeader("X-User-Id") UUID adminUserId,
                                       @RequestHeader(value = "X-User-Roles", required = false) String roles,
                                       @PathVariable UUID id) {
        requireAdmin(roles);
        Map<String, Object> result = enrichPayment(payments.byId(id));
        audit(adminUserId, "GET", "PAYMENT", id);
        return result;
    }

    private Map<String, Object> enrichPayment(Map<String, Object> payment) {
        Map<String, Object> result = new LinkedHashMap<>(payment);
        result.putIfAbsent("providerPaymentId", null);
        result.putIfAbsent("providerStatus", null);
        result.putIfAbsent("relatedTarget", relatedTarget(payment));
        return result;
    }

    private Map<String, Object> relatedTarget(Map<String, Object> payment) {
        Object targetType = payment.get("targetType");
        Object targetId = payment.get("targetId");
        if (!(targetId instanceof String targetIdValue)) {
            return null;
        }
        UUID id = UUID.fromString(targetIdValue);
        if ("BOOKING".equals(targetType)) {
            return bookings.byId(ADMIN_ROLE, id);
        }
        if ("CARGO_ORDER".equals(targetType)) {
            return cargo.byId(ADMIN_ROLE, id);
        }
        return null;
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
                                                 @RequestHeader(value = "X-User-Roles", required = false) String roles,
                                                 @RequestParam(required = false) String status,
                                                 @RequestParam(required = false) UUID tripId,
                                                 @RequestParam(required = false) UUID userId,
                                                 @RequestParam(required = false) UUID paymentId,
                                                 @RequestParam(defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "50") int size) {
        requireAdmin(roles);
        List<Map<String, Object>> result = cargo.all(ADMIN_ROLE, status, tripId, userId, paymentId, page, size);
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

    @PostMapping("/cargo-orders/{id}/cancel")
    public Map<String, Object> cancelCargoOrder(@RequestHeader("X-User-Id") UUID adminUserId,
                                                @RequestHeader(value = "X-User-Roles", required = false) String roles,
                                                @PathVariable UUID id) {
        requireAdmin(roles);
        Map<String, Object> result = cargo.cancel(ADMIN_ROLE, id);
        audit(adminUserId, "CANCEL", "CARGO_ORDER", id);
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

    private Specification<AdminAuditEvent> auditSpec(UUID actorId, String action, String resourceType,
                                                     UUID resourceId, Instant from, Instant to) {
        return (root, query, cb) -> {
            var predicate = cb.conjunction();
            if (actorId != null) {
                predicate = cb.and(predicate, cb.equal(root.get("actorId"), actorId));
            }
            if (action != null && !action.isBlank()) {
                predicate = cb.and(predicate, cb.equal(root.get("action"), action));
            }
            if (resourceType != null && !resourceType.isBlank()) {
                predicate = cb.and(predicate, cb.equal(root.get("resourceType"), resourceType));
            }
            if (resourceId != null) {
                predicate = cb.and(predicate, cb.equal(root.get("resourceId"), resourceId));
            }
            if (from != null) {
                predicate = cb.and(predicate, cb.greaterThanOrEqualTo(root.get("createdAt"), from));
            }
            if (to != null) {
                predicate = cb.and(predicate, cb.lessThanOrEqualTo(root.get("createdAt"), to));
            }
            return predicate;
        };
    }

    public record UpdateRolesRequest(java.util.Set<String> roles) {}
    public record UpdateEnabledRequest(boolean enabled) {}
}
