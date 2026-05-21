package com.ringochi.bookingservice;

import java.time.Instant;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class PaymentEventConsumer {
    private final BookingRepository bookings;
    private final TripClient tripClient;
    private final ProcessedPaymentEventRepository processedEvents;

    public PaymentEventConsumer(BookingRepository bookings, TripClient tripClient,
                                ProcessedPaymentEventRepository processedEvents) {
        this.bookings = bookings;
        this.tripClient = tripClient;
        this.processedEvents = processedEvents;
    }

    @Transactional
    @KafkaListener(topics = "payment-events", groupId = "booking-service")
    public void onPaymentEvent(PaymentEvent event) {
        if (!"BOOKING".equals(event.targetType())) {
            return;
        }
        if (!"PaymentSucceeded".equals(event.eventType()) && !"PaymentFailed".equals(event.eventType())) {
            return;
        }
        bookings.findById(event.targetId()).or(() -> bookings.findByPaymentId(event.paymentId())).ifPresent(booking -> {
            if (booking.getStatus() != BookingStatus.PENDING) {
                return;
            }
            if (processedEvents.insertIfAbsent(event.eventId()) == 0) {
                return;
            }
            if ("PaymentSucceeded".equals(event.eventType())) {
                booking.setStatus(BookingStatus.CONFIRMED);
            } else {
                booking.setStatus(BookingStatus.CANCELLED);
                tripClient.releaseSeat(booking.getTripId());
            }
            booking.setUpdatedAt(Instant.now());
            bookings.save(booking);
        });
    }
}
