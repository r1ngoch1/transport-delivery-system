package com.ringochi.bookingservice;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {
    private final BookingRepository bookings;
    private final TripClient tripClient;
    private final PaymentClient paymentClient;

    public BookingController(BookingRepository bookings, TripClient tripClient, PaymentClient paymentClient) {
        this.bookings = bookings;
        this.tripClient = tripClient;
        this.paymentClient = paymentClient;
    }

    @Transactional
    @PostMapping
    public Booking create(@RequestHeader("X-User-Id") UUID userId, @RequestBody CreateBookingRequest request) {
        var trip = tripClient.getTrip(request.tripId());
        Booking booking = new Booking();
        booking.setUserId(userId);
        booking.setTripId(request.tripId());
        booking.setSeatNumber(request.seatNumber());
        booking.setPrice(trip.price());
        booking = bookings.save(booking);

        try {
            tripClient.reserveSeat(request.tripId());
            var payment = paymentClient.create(new PaymentClient.CreatePaymentRequest(
                    "BOOKING", booking.getId(), userId, trip.price(), "RUB"));
            booking.setPaymentId(payment.id());
            return bookings.save(booking);
        } catch (RuntimeException ex) {
            booking.setStatus(BookingStatus.CANCELLED);
            bookings.save(booking);
            throw ex;
        }
    }

    @GetMapping("/{id}")
    public Booking byId(@RequestHeader("X-User-Id") UUID userId, @PathVariable UUID id) {
        Booking booking = bookings.findById(id).orElseThrow(() -> notFound());
        if (!booking.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot access another user's booking");
        }
        return booking;
    }

    @GetMapping("/my")
    public List<Booking> my(@RequestHeader("X-User-Id") UUID userId) {
        return bookings.findByUserId(userId);
    }

    @GetMapping("/admin")
    public List<Booking> all(@RequestHeader(value = "X-User-Roles", required = false) String roles) {
        requireAdmin(roles);
        return bookings.findAll();
    }

    @GetMapping("/admin/{id}")
    public Booking adminById(@RequestHeader(value = "X-User-Roles", required = false) String roles, @PathVariable UUID id) {
        requireAdmin(roles);
        return bookings.findById(id).orElseThrow(() -> notFound());
    }

    @PostMapping("/{id}/cancel")
    public Booking cancel(@RequestHeader("X-User-Id") UUID userId, @PathVariable UUID id) {
        Booking booking = byId(userId, id);
        if (booking.getStatus() != BookingStatus.CANCELLED) {
            booking.setStatus(BookingStatus.CANCELLED);
            booking.setUpdatedAt(Instant.now());
            tripClient.releaseSeat(booking.getTripId());
        }
        return bookings.save(booking);
    }

    private ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found");
    }

    private void requireAdmin(String roles) {
        if (roles == null || !roles.contains("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ADMIN role required");
        }
    }

    public record CreateBookingRequest(UUID tripId, String seatNumber) {}
}
