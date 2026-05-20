package com.ringochi.bookingservice;

import java.time.Instant;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class PaymentEventConsumer {
    private final BookingRepository bookings;
    private final TripClient tripClient;

    public PaymentEventConsumer(BookingRepository bookings, TripClient tripClient) {
        this.bookings = bookings;
        this.tripClient = tripClient;
    }

    @Transactional
    @KafkaListener(topics = "payment-events", groupId = "booking-service")
    public void onPaymentEvent(PaymentEvent event) {
        if (!"BOOKING".equals(event.targetType())) {
            return;
        }
        bookings.findById(event.targetId()).or(() -> bookings.findByPaymentId(event.paymentId())).ifPresent(booking -> {
            if (booking.getStatus() != BookingStatus.PENDING) {
                return;
            }
            if ("PaymentSucceeded".equals(event.eventType())) {
                booking.setStatus(BookingStatus.CONFIRMED);
            } else if ("PaymentFailed".equals(event.eventType())) {
                booking.setStatus(BookingStatus.CANCELLED);
                tripClient.releaseSeat(booking.getTripId());
            } else {
                return;
            }
            booking.setUpdatedAt(Instant.now());
            bookings.save(booking);
        });
    }
}
