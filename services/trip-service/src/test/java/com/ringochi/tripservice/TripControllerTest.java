package com.ringochi.tripservice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class TripControllerTest {
    @Mock
    private TripRepository trips;
    @Mock
    private RouteClient routeClient;

    private TripController controller;

    @BeforeEach
    void setUp() {
        controller = new TripController(trips, routeClient);
    }

    @Test
    void searchByRouteWithoutDateUsesRouteLookup() {
        UUID routeId = UUID.randomUUID();
        Trip trip = trip(routeId, 10, 8);
        when(trips.findByRouteId(routeId)).thenReturn(List.of(trip));

        List<Trip> result = controller.search(routeId, null);

        assertThat(result).containsExactly(trip);
        verify(trips).findByRouteId(routeId);
    }

    @Test
    void searchByRouteAndDateUsesDayBoundsInUtc() {
        UUID routeId = UUID.randomUUID();
        LocalDate date = LocalDate.of(2026, 5, 20);
        Instant from = date.atStartOfDay().toInstant(ZoneOffset.UTC);
        Trip trip = trip(routeId, 10, 8);
        when(trips.search(routeId, from, from.plusSeconds(86_400))).thenReturn(List.of(trip));

        List<Trip> result = controller.search(routeId, date);

        assertThat(result).containsExactly(trip);
        verify(trips).search(routeId, from, from.plusSeconds(86_400));
    }

    @Test
    void adminCreateValidatesRouteAndDefaultsAvailability() {
        UUID routeId = UUID.randomUUID();
        Trip request = trip(routeId, 12, 0);
        request.setTotalCargoVolume(40.0);
        request.setAvailableCargoVolume(0.0);
        when(routeClient.getRoute(routeId)).thenReturn(new RouteClient.RouteDto(
                routeId, UUID.randomUUID(), UUID.randomUUID(), 100, 120, true));
        when(trips.save(any(Trip.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Trip result = controller.create("PASSENGER,ADMIN", request);

        ArgumentCaptor<Trip> tripCaptor = ArgumentCaptor.forClass(Trip.class);
        verify(trips).save(tripCaptor.capture());
        assertThat(tripCaptor.getValue().getAvailableSeats()).isEqualTo(12);
        assertThat(tripCaptor.getValue().getAvailableCargoVolume()).isEqualTo(40.0);
        assertThat(result).isSameAs(request);
    }

    @Test
    void createRejectsNonAdminUser() {
        Trip request = trip(UUID.randomUUID(), 12, 0);

        assertThatThrownBy(() -> controller.create("PASSENGER", request))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception ->
                        assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN));

        verify(routeClient, never()).getRoute(any(UUID.class));
        verify(trips, never()).save(any(Trip.class));
    }

    @Test
    void adminUpdateChangesStatusAndDriver() {
        Trip existing = trip(UUID.randomUUID(), 12, 8);
        UUID driverId = UUID.randomUUID();
        Trip request = new Trip();
        request.setStatus(TripStatus.CANCELLED);
        request.setDriverId(driverId);
        when(trips.findById(existing.getId())).thenReturn(Optional.of(existing));
        when(trips.save(existing)).thenReturn(existing);

        Trip result = controller.update("ADMIN", existing.getId(), request);

        assertThat(result.getStatus()).isEqualTo(TripStatus.CANCELLED);
        assertThat(result.getDriverId()).isEqualTo(driverId);
        verify(trips).save(existing);
    }

    @Test
    void reserveSeatDecrementsAvailableSeats() {
        Trip trip = trip(UUID.randomUUID(), 12, 2);
        when(trips.findLocked(trip.getId())).thenReturn(Optional.of(trip));
        when(trips.save(trip)).thenReturn(trip);

        Trip result = controller.reserveSeat(trip.getId());

        assertThat(result.getAvailableSeats()).isEqualTo(1);
        verify(trips).save(trip);
    }

    @Test
    void reserveSeatRejectsTripWithoutAvailableSeats() {
        Trip trip = trip(UUID.randomUUID(), 12, 0);
        when(trips.findLocked(trip.getId())).thenReturn(Optional.of(trip));

        assertThatThrownBy(() -> controller.reserveSeat(trip.getId()))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception ->
                        assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.CONFLICT));

        verify(trips, never()).save(any(Trip.class));
    }

    @Test
    void reserveSeatRejectsTripThatIsNotScheduled() {
        Trip trip = trip(UUID.randomUUID(), 12, 2);
        trip.setStatus(TripStatus.CANCELLED);
        when(trips.findLocked(trip.getId())).thenReturn(Optional.of(trip));

        assertThatThrownBy(() -> controller.reserveSeat(trip.getId()))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception ->
                        assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.CONFLICT));

        verify(trips, never()).save(any(Trip.class));
    }

    @Test
    void releaseSeatIncrementsUntilTotalSeats() {
        Trip trip = trip(UUID.randomUUID(), 12, 11);
        when(trips.findLocked(trip.getId())).thenReturn(Optional.of(trip));
        when(trips.save(trip)).thenReturn(trip);

        Trip result = controller.releaseSeat(trip.getId());

        assertThat(result.getAvailableSeats()).isEqualTo(12);
        verify(trips).save(trip);
    }

    private static Trip trip(UUID routeId, int totalSeats, int availableSeats) {
        Trip trip = new Trip();
        trip.setRouteId(routeId);
        trip.setTotalSeats(totalSeats);
        trip.setAvailableSeats(availableSeats);
        trip.setDepartureTime(Instant.parse("2026-05-20T08:00:00Z"));
        trip.setArrivalTime(Instant.parse("2026-05-20T10:00:00Z"));
        return trip;
    }
}
