package com.ringochi.notificationservice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.KafkaContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

@Testcontainers
@SpringBootTest(properties = "spring.kafka.listener.auto-startup=true")
class NotificationKafkaIT {
    @Container
    static final KafkaContainer kafka = new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.6.1"));

    @DynamicPropertySource
    static void kafkaProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);
    }

    @Autowired
    private KafkaTemplate<String, PaymentEvent> kafkaTemplate;

    @MockBean
    private NotificationProvider notificationProvider;

    @Test
    void paymentSucceededEventFromKafkaProducesNotification() {
        UUID bookingId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        PaymentEvent event = new PaymentEvent(UUID.randomUUID(), "PaymentSucceeded", UUID.randomUUID(),
                "BOOKING", bookingId, userId, BigDecimal.valueOf(1200), Instant.now());

        kafkaTemplate.send("payment-events", bookingId.toString(), event);
        kafkaTemplate.flush();

        verify(notificationProvider, timeout(20000)).send(argThat(message ->
                "LOG".equals(message.channel())
                        && userId.equals(message.recipientUserId())
                        && "Booking confirmed".equals(message.subject())
                        && message.body().contains(bookingId.toString())));
    }

    @Test
    void paymentFailedEventFromKafkaProducesNotification() {
        UUID cargoOrderId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        PaymentEvent event = new PaymentEvent(UUID.randomUUID(), "PaymentFailed", UUID.randomUUID(),
                "CARGO", cargoOrderId, userId, BigDecimal.valueOf(900), Instant.now());

        kafkaTemplate.send("payment-events", cargoOrderId.toString(), event);
        kafkaTemplate.flush();

        verify(notificationProvider, timeout(20000)).send(argThat(message -> {
            assertThat(message.body()).contains(cargoOrderId.toString());
            return "LOG".equals(message.channel())
                    && userId.equals(message.recipientUserId())
                    && "Cargo payment failed".equals(message.subject());
        }));
    }
}
