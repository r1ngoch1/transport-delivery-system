package com.ringochi.bookingservice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
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
class BookingControllerTest {
    @Mock
    private BookingRepository bookings;
    @Mock
    private TripClient tripClient;
    @Mock
    private PaymentClient paymentClient;

    private BookingController controller;

    @BeforeEach
    void setUp() {
        controller = new BookingController(bookings, tripClient, paymentClient);
    }

    @Test
    void createReservesSeatCreatesPaymentAndStoresPaymentId() {
        UUID userId = UUID.randomUUID();
        UUID tripId = UUID.randomUUID();
        UUID paymentId = UUID.randomUUID();
        BigDecimal price = new BigDecimal("1500.00");
        BookingController.CreateBookingRequest request = new BookingController.CreateBookingRequest(tripId, "12A");
        when(tripClient.getTrip(tripId)).thenReturn(trip(tripId, price));
        when(bookings.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(paymentClient.create(any(PaymentClient.CreatePaymentRequest.class)))
                .thenReturn(new PaymentClient.PaymentDto(paymentId, "BOOKING", UUID.randomUUID(), userId, price, "RUB", "SUCCESS"));

        Booking result = controller.create(userId, request);

        assertThat(result.getUserId()).isEqualTo(userId);
        assertThat(result.getTripId()).isEqualTo(tripId);
        assertThat(result.getSeatNumber()).isEqualTo("12A");
        assertThat(result.getPrice()).isEqualByComparingTo(price);
        assertThat(result.getPaymentId()).isEqualTo(paymentId);
        assertThat(result.getStatus()).isEqualTo(BookingStatus.PENDING);
        verify(tripClient).reserveSeat(tripId);

        ArgumentCaptor<PaymentClient.CreatePaymentRequest> paymentCaptor =
                ArgumentCaptor.forClass(PaymentClient.CreatePaymentRequest.class);
        verify(paymentClient).create(paymentCaptor.capture());
        assertThat(paymentCaptor.getValue().targetType()).isEqualTo("BOOKING");
        assertThat(paymentCaptor.getValue().userId()).isEqualTo(userId);
        assertThat(paymentCaptor.getValue().amount()).isEqualByComparingTo(price);
    }

    @Test
    void createCancelsBookingWhenPaymentCreationFails() {
        UUID userId = UUID.randomUUID();
        UUID tripId = UUID.randomUUID();
        BookingController.CreateBookingRequest request = new BookingController.CreateBookingRequest(tripId, "12A");
        when(tripClient.getTrip(tripId)).thenReturn(trip(tripId, new BigDecimal("1500.00")));
        when(bookings.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(paymentClient.create(any(PaymentClient.CreatePaymentRequest.class))).thenThrow(new RuntimeException("payment unavailable"));

        assertThatThrownBy(() -> controller.create(userId, request))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("payment unavailable");

        ArgumentCaptor<Booking> bookingCaptor = ArgumentCaptor.forClass(Booking.class);
        verify(bookings, org.mockito.Mockito.atLeastOnce()).save(bookingCaptor.capture());
        assertThat(bookingCaptor.getAllValues().get(bookingCaptor.getAllValues().size() - 1).getStatus())
                .isEqualTo(BookingStatus.CANCELLED);
    }

    @Test
    void myReturnsCurrentUserBookings() {
        UUID userId = UUID.randomUUID();
        Booking booking = booking(userId, UUID.randomUUID(), BookingStatus.PENDING);
        when(bookings.findByUserId(userId)).thenReturn(List.of(booking));

        List<Booking> result = controller.my(userId);

        assertThat(result).containsExactly(booking);
    }

    @Test
    void byIdRejectsAnotherUsersBooking() {
        UUID requestedBy = UUID.randomUUID();
        Booking booking = booking(UUID.randomUUID(), UUID.randomUUID(), BookingStatus.PENDING);
        when(bookings.findById(booking.getId())).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> controller.byId(requestedBy, booking.getId()))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception ->
                        assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    void cancelMarksBookingCancelledAndReleasesSeat() {
        UUID userId = UUID.randomUUID();
        Booking booking = booking(userId, UUID.randomUUID(), BookingStatus.PENDING);
        when(bookings.findById(booking.getId())).thenReturn(Optional.of(booking));
        when(bookings.save(booking)).thenReturn(booking);

        Booking result = controller.cancel(userId, booking.getId());

        assertThat(result.getStatus()).isEqualTo(BookingStatus.CANCELLED);
        verify(tripClient).releaseSeat(booking.getTripId());
        verify(bookings).save(booking);
    }

    private static TripClient.TripDto trip(UUID tripId, BigDecimal price) {
        return new TripClient.TripDto(tripId, UUID.randomUUID(), Instant.parse("2026-05-20T08:00:00Z"),
                Instant.parse("2026-05-20T10:00:00Z"), 12, 8, price, "SCHEDULED");
    }

    private static Booking booking(UUID userId, UUID tripId, BookingStatus status) {
        Booking booking = new Booking();
        booking.setUserId(userId);
        booking.setTripId(tripId);
        booking.setSeatNumber("12A");
        booking.setPrice(new BigDecimal("1500.00"));
        booking.setStatus(status);
        return booking;
    }
}
