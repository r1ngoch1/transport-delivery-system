package com.ringochi.bookingservice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import org.awaitility.Awaitility;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.serializer.JsonSerializer;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.KafkaContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

@Testcontainers
@ActiveProfiles("test")
@SpringBootTest
class BookingKafkaIT {
    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");
    @Container
    static final KafkaContainer kafka = new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.6.1"));

    @DynamicPropertySource
    static void containerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);
        registry.add("spring.kafka.listener.auto-startup", () -> "true");
    }

    @MockBean
    private TripClient tripClient;
    @MockBean
    private PaymentClient paymentClient;
    @Autowired
    private BookingRepository bookings;

    @Test
    void paymentSucceededEventConfirmsBooking() {
        Booking booking = bookings.save(booking());

        publish(event("PaymentSucceeded", booking));

        Awaitility.await().atMost(20, TimeUnit.SECONDS)
                .untilAsserted(() -> assertThat(bookings.findById(booking.getId()))
                        .get().extracting(Booking::getStatus).isEqualTo(BookingStatus.CONFIRMED));
    }

    @Test
    void paymentFailedEventCancelsBookingAndReleasesSeat() {
        Booking booking = bookings.save(booking());

        publish(event("PaymentFailed", booking));

        Awaitility.await().atMost(20, TimeUnit.SECONDS)
                .untilAsserted(() -> assertThat(bookings.findById(booking.getId()))
                        .get().extracting(Booking::getStatus).isEqualTo(BookingStatus.CANCELLED));
        verify(tripClient, timeout(20_000)).releaseSeat(eq(booking.getTripId()));
    }

    @Test
    void repeatedPaymentFailedEventIsProcessedOnce() {
        Booking booking = bookings.save(booking());
        PaymentEvent event = event("PaymentFailed", booking);

        publish(event);
        publish(event);

        Awaitility.await().atMost(20, TimeUnit.SECONDS)
                .untilAsserted(() -> assertThat(bookings.findById(booking.getId()))
                        .get().extracting(Booking::getStatus).isEqualTo(BookingStatus.CANCELLED));
        verify(tripClient, timeout(20_000).times(1)).releaseSeat(eq(booking.getTripId()));
    }

    private void publish(PaymentEvent event) {
        Map<String, Object> producerProps = Map.of(
                "bootstrap.servers", kafka.getBootstrapServers(),
                "key.serializer", org.apache.kafka.common.serialization.StringSerializer.class,
                "value.serializer", JsonSerializer.class,
                "spring.json.add.type.headers", false);
        KafkaTemplate<String, PaymentEvent> kafkaTemplate = new KafkaTemplate<>(new DefaultKafkaProducerFactory<>(producerProps));
        kafkaTemplate.send("payment-events", event.targetId().toString(), event);
        kafkaTemplate.flush();
        kafkaTemplate.destroy();
    }

    private static Booking booking() {
        Booking booking = new Booking();
        booking.setUserId(UUID.randomUUID());
        booking.setTripId(UUID.randomUUID());
        booking.setSeatNumber("12A");
        booking.setPrice(new BigDecimal("1500.00"));
        booking.setStatus(BookingStatus.PENDING);
        return booking;
    }

    private static PaymentEvent event(String eventType, Booking booking) {
        return new PaymentEvent(UUID.randomUUID(), eventType, UUID.randomUUID(), "BOOKING", booking.getId(),
                booking.getUserId(), booking.getPrice(), Instant.now());
    }
}
