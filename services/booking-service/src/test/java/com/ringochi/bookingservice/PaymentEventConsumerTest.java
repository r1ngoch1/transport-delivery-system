package com.ringochi.bookingservice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PaymentEventConsumerTest {
    @Mock
    private BookingRepository bookings;
    @Mock
    private TripClient tripClient;
    @Mock
    private ProcessedPaymentEventRepository processedEvents;

    private PaymentEventConsumer consumer;

    @BeforeEach
    void setUp() {
        consumer = new PaymentEventConsumer(bookings, tripClient, processedEvents);
    }

    @Test
    void paymentSucceededConfirmsPendingBooking() {
        Booking booking = booking(BookingStatus.PENDING);
        PaymentEvent event = event("PaymentSucceeded", "BOOKING", booking.getId(), UUID.randomUUID());
        when(bookings.findById(booking.getId())).thenReturn(Optional.of(booking));
        when(processedEvents.insertIfAbsent(event.eventId())).thenReturn(1);

        consumer.onPaymentEvent(event);

        assertThat(booking.getStatus()).isEqualTo(BookingStatus.CONFIRMED);
        verify(bookings).save(booking);
    }

    @Test
    void paymentFailedCancelsPendingBookingAndReleasesSeat() {
        Booking booking = booking(BookingStatus.PENDING);
        PaymentEvent event = event("PaymentFailed", "BOOKING", booking.getId(), UUID.randomUUID());
        when(bookings.findById(booking.getId())).thenReturn(Optional.of(booking));
        when(processedEvents.insertIfAbsent(event.eventId())).thenReturn(1);

        consumer.onPaymentEvent(event);

        assertThat(booking.getStatus()).isEqualTo(BookingStatus.CANCELLED);
        verify(tripClient).releaseSeat(booking.getTripId());
        verify(bookings).save(booking);
    }

    @Test
    void nonBookingPaymentEventIsIgnored() {
        PaymentEvent event = event("PaymentSucceeded", "CARGO", UUID.randomUUID(), UUID.randomUUID());

        consumer.onPaymentEvent(event);

        verify(processedEvents, never()).insertIfAbsent(event.eventId());
        verify(bookings, never()).findById(event.targetId());
    }

    @Test
    void unknownPaymentEventTypeIsIgnored() {
        Booking booking = booking(BookingStatus.PENDING);
        PaymentEvent event = event("PaymentExpired", "BOOKING", booking.getId(), UUID.randomUUID());

        consumer.onPaymentEvent(event);

        assertThat(booking.getStatus()).isEqualTo(BookingStatus.PENDING);
        verify(processedEvents, never()).insertIfAbsent(event.eventId());
        verify(bookings, never()).findById(booking.getId());
        verify(bookings, never()).save(booking);
        verify(tripClient, never()).releaseSeat(booking.getTripId());
    }

    @Test
    void duplicatePaymentEventIsIgnored() {
        Booking booking = booking(BookingStatus.PENDING);
        PaymentEvent event = event("PaymentSucceeded", "BOOKING", booking.getId(), UUID.randomUUID());
        when(bookings.findById(booking.getId())).thenReturn(Optional.of(booking));
        when(processedEvents.insertIfAbsent(event.eventId())).thenReturn(0);

        consumer.onPaymentEvent(event);

        assertThat(booking.getStatus()).isEqualTo(BookingStatus.PENDING);
        verify(bookings, never()).save(booking);
        verify(tripClient, never()).releaseSeat(booking.getTripId());
    }

    private static Booking booking(BookingStatus status) {
        Booking booking = new Booking();
        booking.setUserId(UUID.randomUUID());
        booking.setTripId(UUID.randomUUID());
        booking.setSeatNumber("12A");
        booking.setPrice(new BigDecimal("1500.00"));
        booking.setStatus(status);
        return booking;
    }

    private static PaymentEvent event(String eventType, String targetType, UUID targetId, UUID paymentId) {
        return new PaymentEvent(UUID.randomUUID(), eventType, paymentId, targetType, targetId, UUID.randomUUID(),
                new BigDecimal("1500.00"), Instant.parse("2026-05-20T08:00:00Z"));
    }
}
