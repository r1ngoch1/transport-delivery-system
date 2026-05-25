package com.ringochi.notificationservice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.KafkaContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

@Testcontainers
@SpringBootTest(properties = {
        "spring.kafka.listener.auto-startup=true",
        "spring.jpa.open-in-view=false"
})
class NotificationKafkaIT {
    @Container
    static final KafkaContainer kafka = new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.6.1"));
    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @DynamicPropertySource
    static void containerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private KafkaTemplate<String, PaymentEvent> kafkaTemplate;
    @Autowired
    private NotificationRepository notifications;

    @MockBean
    private NotificationProvider notificationProvider;

    @BeforeEach
    void cleanDatabase() {
        notifications.deleteAll();
    }

    @Test
    void paymentSucceededEventFromKafkaStoresNotification() {
        UUID bookingId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();
        PaymentEvent event = new PaymentEvent(eventId, "PaymentSucceeded", UUID.randomUUID(),
                "BOOKING", bookingId, userId, BigDecimal.valueOf(1200), Instant.now());

        kafkaTemplate.send("payment-events", bookingId.toString(), event);
        kafkaTemplate.flush();

        verify(notificationProvider, timeout(20000)).send(argThat(message ->
                "LOG".equals(message.channel())
                        && userId.equals(message.recipientUserId())
                        && "Booking confirmed".equals(message.subject())
                        && message.body().contains(bookingId.toString())));
        assertThat(notifications.findByEventId(eventId)).hasValueSatisfying(notification -> {
            assertThat(notification.getRecipientUserId()).isEqualTo(userId);
            assertThat(notification.getEntityId()).isEqualTo(bookingId);
            assertThat(notification.getType()).isEqualTo(NotificationType.BOOKING);
            assertThat(notification.getSeverity()).isEqualTo(NotificationSeverity.SUCCESS);
        });
    }

    @Test
    void paymentFailedEventFromKafkaStoresNotification() {
        UUID cargoOrderId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();
        PaymentEvent event = new PaymentEvent(eventId, "PaymentFailed", UUID.randomUUID(),
                "CARGO", cargoOrderId, userId, BigDecimal.valueOf(900), Instant.now());

        kafkaTemplate.send("payment-events", cargoOrderId.toString(), event);
        kafkaTemplate.flush();

        verify(notificationProvider, timeout(20000)).send(argThat(message -> {
            assertThat(message.body()).contains(cargoOrderId.toString());
            return "LOG".equals(message.channel())
                    && userId.equals(message.recipientUserId())
                    && "Cargo payment failed".equals(message.subject());
        }));
        assertThat(notifications.findByEventId(eventId)).hasValueSatisfying(notification -> {
            assertThat(notification.getRecipientUserId()).isEqualTo(userId);
            assertThat(notification.getEntityId()).isEqualTo(cargoOrderId);
            assertThat(notification.getType()).isEqualTo(NotificationType.PAYMENT);
            assertThat(notification.getSeverity()).isEqualTo(NotificationSeverity.ERROR);
        });
    }
}
