package com.ringochi.adminservice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
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

    private AdminController controller;
    private UUID adminUserId;

    @BeforeEach
    void setUp() {
        adminUserId = UUID.randomUUID();
        controller = new AdminController(users, routes, trips, bookings, payments, drivers, cargo, auditLogger);
    }

    @Test
    void listsUsersThroughUserServiceWithAdminRole() {
        Map<String, Object> user = Map.of("email", "admin@example.com");
        when(users.all("ADMIN")).thenReturn(List.of(user));

        List<Map<String, Object>> result = controller.users(adminUserId, "ADMIN");

        assertThat(result).containsExactly(user);
        verify(users).all("ADMIN");
        verify(auditLogger).log(adminUserId, "LIST", "USER", null);
    }

    @Test
    void listsRouteResourcesThroughRouteService() {
        Map<String, Object> city = Map.of("name", "Ekaterinburg");
        Map<String, Object> route = Map.of("distanceKm", 210);
        when(routes.cities()).thenReturn(List.of(city));
        when(routes.routes()).thenReturn(List.of(route));

        assertThat(controller.cities(adminUserId, "ADMIN")).containsExactly(city);
        assertThat(controller.routes(adminUserId, "ADMIN")).containsExactly(route);
        verify(auditLogger).log(adminUserId, "LIST", "CITY", null);
        verify(auditLogger).log(adminUserId, "LIST", "ROUTE", null);
    }

    @Test
    void listsTripsThroughTripService() {
        UUID routeId = UUID.randomUUID();
        Map<String, Object> trip = Map.of("routeId", routeId.toString());
        when(trips.all(routeId, "2026-06-01")).thenReturn(List.of(trip));

        List<Map<String, Object>> result = controller.trips(adminUserId, "ADMIN", routeId, "2026-06-01");

        assertThat(result).containsExactly(trip);
        verify(auditLogger).log(adminUserId, "LIST", "TRIP", null);
    }

    @Test
    void listsTripsWithoutFiltersThroughTripListEndpoint() {
        Map<String, Object> trip = Map.of("status", "SCHEDULED");
        when(trips.list()).thenReturn(List.of(trip));

        List<Map<String, Object>> result = controller.trips(adminUserId, "ADMIN", null, null);

        assertThat(result).containsExactly(trip);
        verify(auditLogger).log(adminUserId, "LIST", "TRIP", null);
    }

    @Test
    void readsBookingsThroughBookingServiceWithAdminRole() {
        UUID bookingId = UUID.randomUUID();
        Map<String, Object> booking = Map.of("id", bookingId.toString());
        when(bookings.all("ADMIN")).thenReturn(List.of(booking));
        when(bookings.byId("ADMIN", bookingId)).thenReturn(booking);

        assertThat(controller.bookings(adminUserId, "ADMIN")).containsExactly(booking);
        assertThat(controller.booking(adminUserId, "ADMIN", bookingId)).isEqualTo(booking);
        verify(auditLogger).log(adminUserId, "LIST", "BOOKING", null);
        verify(auditLogger).log(adminUserId, "GET", "BOOKING", bookingId);
    }

    @Test
    void readsPaymentsDriversAndCargo() {
        UUID id = UUID.randomUUID();
        Map<String, Object> payment = Map.of("id", id.toString());
        Map<String, Object> driver = Map.of("id", id.toString());
        Map<String, Object> cargoOrder = Map.of("id", id.toString());
        when(payments.all(null, null)).thenReturn(List.of(payment));
        when(drivers.all("ADMIN")).thenReturn(List.of(driver));
        when(cargo.all("ADMIN")).thenReturn(List.of(cargoOrder));
        when(cargo.byId("ADMIN", id)).thenReturn(cargoOrder);

        assertThat(controller.payments(adminUserId, "ADMIN", null, null)).containsExactly(payment);
        assertThat(controller.drivers(adminUserId, "ADMIN")).containsExactly(driver);
        assertThat(controller.cargoOrders(adminUserId, "ADMIN")).containsExactly(cargoOrder);
        assertThat(controller.cargoOrder(adminUserId, "ADMIN", id)).isEqualTo(cargoOrder);
        verify(auditLogger).log(adminUserId, "LIST", "PAYMENT", null);
        verify(auditLogger).log(adminUserId, "LIST", "DRIVER", null);
        verify(auditLogger).log(adminUserId, "LIST", "CARGO_ORDER", null);
        verify(auditLogger).log(adminUserId, "GET", "CARGO_ORDER", id);
    }

    @Test
    void rejectsNonAdminBeforeCallingClients() {
        assertThatThrownBy(() -> controller.users(adminUserId, "PASSENGER"))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception ->
                        assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN));

        verifyNoInteractions(users, routes, trips, bookings, payments, drivers, cargo, auditLogger);
    }
}
