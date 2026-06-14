package com.ringochi.adminservice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class AdminControllerTest {
    @Mock
    private AdminClients.UserClient users;
    @Mock
    private AdminClients.RouteClient routes;
    @Mock
    private AdminClients.TripClient trips;
    @Mock
    private AdminClients.BookingClient bookings;
    @Mock
    private AdminClients.PaymentClient payments;
    @Mock
    private AdminClients.DriverClient drivers;
    @Mock
    private AdminClients.CargoClient cargo;
    @Mock
    private AdminAuditLogger auditLogger;
    @Mock
    private AdminAuditEventRepository auditEvents;

    private AdminController controller;
    private UUID adminUserId;

    @BeforeEach
    void setUp() {
        adminUserId = UUID.randomUUID();
        controller = new AdminController(users, routes, trips, bookings, payments, drivers, cargo, auditLogger, auditEvents);
    }

    @Test
    void listsUsersThroughUserServiceWithAdminRole() {
        Map<String, Object> user = Map.of("email", "admin@example.com");
        when(users.all("ADMIN", null, null, null, 0, 50)).thenReturn(List.of(user));

        List<Map<String, Object>> result = controller.users(adminUserId, "ADMIN", null, null, null, 0, 50);

        assertThat(result).containsExactly(user);
        verify(users).all("ADMIN", null, null, null, 0, 50);
        verify(auditLogger).log(adminUserId, "LIST", "USER", null);
    }

    @Test
    void listsRouteResourcesThroughRouteService() {
        UUID id = UUID.randomUUID();
        Map<String, Object> city = Map.of("name", "Ekaterinburg");
        Map<String, Object> route = Map.of("distanceKm", 210);
        when(routes.cities()).thenReturn(List.of(city));
        when(routes.routes()).thenReturn(List.of(route));
        when(routes.city(id)).thenReturn(city);
        when(routes.route(id)).thenReturn(route);

        assertThat(controller.cities(adminUserId, "ADMIN")).containsExactly(city);
        assertThat(controller.routes(adminUserId, "ADMIN")).containsExactly(route);
        assertThat(controller.city(adminUserId, "ADMIN", id)).isEqualTo(city);
        assertThat(controller.route(adminUserId, "ADMIN", id)).isEqualTo(route);
        verify(auditLogger).log(adminUserId, "LIST", "CITY", null);
        verify(auditLogger).log(adminUserId, "LIST", "ROUTE", null);
        verify(auditLogger).log(adminUserId, "GET", "CITY", id);
        verify(auditLogger).log(adminUserId, "GET", "ROUTE", id);
    }

    @Test
    void deletesRouteResourcesThroughRouteService() {
        UUID cityId = UUID.randomUUID();
        UUID routeId = UUID.randomUUID();
        when(trips.all(null, routeId, null, null, null, 0, 50)).thenReturn(List.of());

        controller.deleteCity(adminUserId, "ADMIN", cityId);
        controller.deleteRoute(adminUserId, "ADMIN", routeId);

        verify(routes).deleteCity("ADMIN", cityId);
        verify(routes).deleteRoute("ADMIN", routeId);
        verify(auditLogger).log(adminUserId, "DELETE", "CITY", cityId);
        verify(auditLogger).log(adminUserId, "DELETE", "ROUTE", routeId);
    }

    @Test
    void rejectsRouteDeleteWhenRouteHasTrips() {
        UUID routeId = UUID.randomUUID();
        when(trips.all(null, routeId, null, null, null, 0, 50)).thenReturn(List.of(Map.of("id", "trip-1")));

        assertThatThrownBy(() -> controller.deleteRoute(adminUserId, "ADMIN", routeId))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception ->
                        assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void listsTripsThroughTripService() {
        UUID routeId = UUID.randomUUID();
        UUID driverId = UUID.randomUUID();
        Map<String, Object> trip = Map.of("routeId", routeId.toString());
        when(trips.all("SCHEDULED", routeId, driverId, "2026-06-01T00:00:00Z", "2026-06-02T00:00:00Z", 1, 10))
                .thenReturn(List.of(trip));

        List<Map<String, Object>> result = controller.trips(adminUserId, "ADMIN", "SCHEDULED", routeId, driverId,
                "2026-06-01T00:00:00Z", "2026-06-02T00:00:00Z", 1, 10);

        assertThat(result).containsExactly(trip);
        verify(auditLogger).log(adminUserId, "LIST", "TRIP", null);
    }

    @Test
    void listsTripsWithoutFiltersThroughTripListEndpoint() {
        Map<String, Object> trip = Map.of("status", "SCHEDULED");
        when(trips.all(null, null, null, null, null, 0, 50)).thenReturn(List.of(trip));

        List<Map<String, Object>> result = controller.trips(adminUserId, "ADMIN", null, null, null, null, null, 0, 50);

        assertThat(result).containsExactly(trip);
        verify(auditLogger).log(adminUserId, "LIST", "TRIP", null);
    }

    @Test
    void createsUpdatesAndCancelsTripsThroughTripService() {
        UUID tripId = UUID.randomUUID();
        Map<String, Object> request = Map.of("status", "SCHEDULED");
        Map<String, Object> result = Map.of("id", tripId.toString());
        when(trips.create("ADMIN", request)).thenReturn(result);
        when(trips.update("ADMIN", tripId, request)).thenReturn(result);
        when(trips.cancel("ADMIN", tripId)).thenReturn(result);

        assertThat(controller.createTrip(adminUserId, "ADMIN", request)).isEqualTo(result);
        assertThat(controller.updateTrip(adminUserId, "ADMIN", tripId, request)).isEqualTo(result);
        assertThat(controller.cancelTrip(adminUserId, "ADMIN", tripId)).isEqualTo(result);
        verify(auditLogger).log(adminUserId, "CREATE", "TRIP", null);
        verify(auditLogger).log(adminUserId, "UPDATE", "TRIP", tripId);
        verify(auditLogger).log(adminUserId, "CANCEL", "TRIP", tripId);
    }

    @Test
    void readsBookingsThroughBookingServiceWithAdminRole() {
        UUID bookingId = UUID.randomUUID();
        Map<String, Object> booking = Map.of("id", bookingId.toString());
        UUID userId = UUID.randomUUID();
        UUID tripId = UUID.randomUUID();
        UUID paymentId = UUID.randomUUID();
        when(bookings.all("ADMIN", "CONFIRMED", userId, tripId, paymentId, 1, 10)).thenReturn(List.of(booking));
        when(bookings.byId("ADMIN", bookingId)).thenReturn(booking);
        when(bookings.cancel("ADMIN", bookingId)).thenReturn(booking);

        assertThat(controller.bookings(adminUserId, "ADMIN", "CONFIRMED", userId, tripId, paymentId, 1, 10))
                .containsExactly(booking);
        assertThat(controller.booking(adminUserId, "ADMIN", bookingId)).isEqualTo(booking);
        assertThat(controller.cancelBooking(adminUserId, "ADMIN", bookingId)).isEqualTo(booking);
        verify(auditLogger).log(adminUserId, "LIST", "BOOKING", null);
        verify(auditLogger).log(adminUserId, "GET", "BOOKING", bookingId);
        verify(auditLogger).log(adminUserId, "CANCEL", "BOOKING", bookingId);
    }

    @Test
    void readsPaymentsDriversAndCargo() {
        UUID id = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        Map<String, Object> payment = Map.of(
                "id", id.toString(),
                "targetType", "BOOKING",
                "targetId", targetId.toString(),
                "userId", userId.toString(),
                "idempotencyKey", "payment-key-1");
        Map<String, Object> booking = Map.of("id", targetId.toString(), "status", "CONFIRMED");
        Map<String, Object> driver = Map.of("id", id.toString());
        Map<String, Object> cargoOrder = Map.of("id", id.toString());
        UUID cargoTripId = UUID.randomUUID();
        UUID cargoUserId = UUID.randomUUID();
        UUID cargoPaymentId = UUID.randomUUID();
        when(payments.all("SUCCESS", "BOOKING", targetId, userId, 1, 10)).thenReturn(List.of(payment));
        when(payments.byId(id)).thenReturn(payment);
        when(bookings.byId("ADMIN", targetId)).thenReturn(booking);
        when(drivers.all("ADMIN")).thenReturn(List.of(driver));
        when(cargo.all("ADMIN", "PAID", cargoTripId, cargoUserId, cargoPaymentId, 1, 10)).thenReturn(List.of(cargoOrder));
        when(cargo.byId("ADMIN", id)).thenReturn(cargoOrder);
        when(cargo.cancel("ADMIN", id)).thenReturn(cargoOrder);

        assertThat(controller.payments(adminUserId, "ADMIN", "SUCCESS", "BOOKING", targetId, userId, 1, 10)).containsExactly(payment);
        assertThat(controller.payment(adminUserId, "ADMIN", id))
                .containsEntry("idempotencyKey", "payment-key-1")
                .containsEntry("providerPaymentId", null)
                .containsEntry("providerStatus", null)
                .containsEntry("relatedTarget", booking);
        assertThat(controller.drivers(adminUserId, "ADMIN")).containsExactly(driver);
        assertThat(controller.cargoOrders(adminUserId, "ADMIN", "PAID", cargoTripId, cargoUserId, cargoPaymentId, 1, 10))
                .containsExactly(cargoOrder);
        assertThat(controller.cargoOrder(adminUserId, "ADMIN", id)).isEqualTo(cargoOrder);
        assertThat(controller.cancelCargoOrder(adminUserId, "ADMIN", id)).isEqualTo(cargoOrder);
        verify(auditLogger).log(adminUserId, "LIST", "PAYMENT", null);
        verify(auditLogger).log(adminUserId, "GET", "PAYMENT", id);
        verify(auditLogger).log(adminUserId, "LIST", "DRIVER", null);
        verify(auditLogger).log(adminUserId, "LIST", "CARGO_ORDER", null);
        verify(auditLogger).log(adminUserId, "GET", "CARGO_ORDER", id);
        verify(auditLogger).log(adminUserId, "CANCEL", "CARGO_ORDER", id);
    }

    @Test
    void returnsSummaryCountsFromAdminFacadeClients() {
        when(users.all("ADMIN", null, null, null, 0, 50)).thenReturn(List.of(Map.of("id", "user-1"), Map.of("id", "user-2")));
        when(routes.cities()).thenReturn(List.of(Map.of("id", "city-1")));
        when(routes.routes()).thenReturn(List.of(Map.of("id", "route-1"), Map.of("id", "route-2")));
        when(trips.all(null, null, null, null, null, 0, 50))
                .thenReturn(List.of(Map.of("id", "trip-1"), Map.of("id", "trip-2"), Map.of("id", "trip-3")));
        when(bookings.all("ADMIN", null, null, null, null, 0, 50)).thenReturn(List.of(Map.of("id", "booking-1")));
        when(payments.all(null, null, null, null, 0, 50)).thenReturn(List.of(Map.of("id", "payment-1"), Map.of("id", "payment-2")));
        when(cargo.all("ADMIN", null, null, null, null, 0, 50)).thenReturn(List.of(Map.of("id", "cargo-1")));

        Map<String, Long> result = controller.summary(adminUserId, "ADMIN");

        assertThat(result).containsExactlyInAnyOrderEntriesOf(Map.of(
                "users", 2L,
                "cities", 1L,
                "routes", 2L,
                "trips", 3L,
                "bookings", 1L,
                "payments", 2L,
                "cargoOrders", 1L,
                "auditEvents", 0L
        ));
        verify(auditLogger).log(adminUserId, "GET", "SUMMARY", null);
    }

    @Test
    void updatesUserRolesAndEnabledThroughUserService() {
        UUID userId = UUID.randomUUID();
        Map<String, Object> roleResult = Map.of("id", userId.toString(), "roles", List.of("ADMIN"));
        Map<String, Object> enabledResult = Map.of("id", userId.toString(), "enabled", false);
        var rolesRequest = new AdminController.UpdateRolesRequest(Set.of("ADMIN"));
        var enabledRequest = new AdminController.UpdateEnabledRequest(false);
        when(users.updateRoles("ADMIN", userId, rolesRequest)).thenReturn(roleResult);
        when(users.updateEnabled("ADMIN", userId, enabledRequest)).thenReturn(enabledResult);

        assertThat(controller.updateUserRoles(adminUserId, "ADMIN", userId, rolesRequest)).isEqualTo(roleResult);
        assertThat(controller.updateUserEnabled(adminUserId, "ADMIN", userId, enabledRequest)).isEqualTo(enabledResult);
        verify(auditLogger).log(adminUserId, "UPDATE_ROLES", "USER", userId);
        verify(auditLogger).log(adminUserId, "UPDATE_ENABLED", "USER", userId);
    }

    @Test
    void listsAuditEventsWithFiltersAndPaging() {
        UUID resourceId = UUID.randomUUID();
        Instant from = Instant.parse("2026-05-01T00:00:00Z");
        Instant to = Instant.parse("2026-05-24T00:00:00Z");
        AdminAuditEvent event = new AdminAuditEvent(adminUserId, "LIST", "USER", resourceId, Map.of("path", "/api/admin/users"));
        when(auditEvents.findAll(org.mockito.ArgumentMatchers.<Specification<AdminAuditEvent>>any(), org.mockito.ArgumentMatchers.any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(event)));

        List<AdminAuditEvent> result = controller.auditEvents(adminUserId, "ADMIN", adminUserId, "LIST", "USER",
                resourceId, from, to, 2, 5);

        assertThat(result).containsExactly(event);
        verify(auditEvents).findAll(org.mockito.ArgumentMatchers.<Specification<AdminAuditEvent>>any(),
                org.mockito.ArgumentMatchers.eq(PageRequest.of(2, 5, Sort.by(Sort.Direction.DESC, "createdAt"))));
        verify(auditLogger).log(adminUserId, "LIST", "AUDIT_EVENT", null);
    }

    @Test
    void readsAuditEventById() {
        AdminAuditEvent event = new AdminAuditEvent(adminUserId, "GET", "PAYMENT", UUID.randomUUID(), Map.of());
        when(auditEvents.findById(event.getId())).thenReturn(Optional.of(event));

        AdminAuditEvent result = controller.auditEvent(adminUserId, "ADMIN", event.getId());

        assertThat(result).isEqualTo(event);
        verify(auditLogger).log(adminUserId, "GET", "AUDIT_EVENT", event.getId());
    }

    @Test
    void returnsNotFoundWhenAuditEventIsMissing() {
        UUID id = UUID.randomUUID();
        when(auditEvents.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> controller.auditEvent(adminUserId, "ADMIN", id))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception ->
                        assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    void rejectsNonAdminBeforeCallingClients() {
        assertThatThrownBy(() -> controller.users(adminUserId, "PASSENGER", null, null, null, 0, 50))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception ->
                        assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN));

        verifyNoInteractions(users, routes, trips, bookings, payments, drivers, cargo, auditLogger);
    }
}
