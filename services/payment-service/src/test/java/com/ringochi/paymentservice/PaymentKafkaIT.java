package com.ringochi.paymentservice;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.apache.kafka.clients.consumer.Consumer;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.test.utils.KafkaTestUtils;
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
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class PaymentKafkaIT {
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
    }

    @Autowired
    private TestRestTemplate rest;

    @Test
    void creatingPaymentPublishesPaymentSucceededToKafka() {
        Payment request = payment();
        Map<String, Object> consumerProps = KafkaTestUtils.consumerProps(
                kafka.getBootstrapServers(), "payment-service-it-" + UUID.randomUUID(), "true");
        Consumer<String, String> consumer = new DefaultKafkaConsumerFactory<>(
                consumerProps, new StringDeserializer(), new StringDeserializer()).createConsumer();
        consumer.subscribe(java.util.List.of("payment-events"));

        ResponseEntity<Payment> response = rest.postForEntity("/api/payments", request, Payment.class);

        assertThat(response.getStatusCode().value()).isEqualTo(201);
        Payment created = response.getBody();
        assertThat(created).isNotNull();
        assertThat(created.getStatus()).isEqualTo(PaymentStatus.SUCCESS);

        ConsumerRecord<String, String> record = recordsForPayment(consumer, created.getId()).get(0);
        assertThat(record.key()).isEqualTo(request.getTargetId().toString());
        assertThat(record.value()).contains("\"eventType\":\"PaymentSucceeded\"");
        assertThat(record.value()).contains("\"paymentId\":\"" + created.getId() + "\"");
        assertThat(record.value()).contains("\"targetId\":\"" + request.getTargetId() + "\"");
        consumer.close();
    }

    @Test
    void repeatedPaymentRequestWithSameIdempotencyKeyReturnsExistingPaymentWithoutSecondKafkaEvent() {
        Payment request = payment();
        String idempotencyKey = "payment-key-" + UUID.randomUUID();
        Map<String, Object> consumerProps = KafkaTestUtils.consumerProps(
                kafka.getBootstrapServers(), "payment-service-it-" + UUID.randomUUID(), "true");
        Consumer<String, String> consumer = new DefaultKafkaConsumerFactory<>(
                consumerProps, new StringDeserializer(), new StringDeserializer()).createConsumer();
        consumer.subscribe(java.util.List.of("payment-events"));
        HttpHeaders headers = new HttpHeaders();
        headers.add("Idempotency-Key", idempotencyKey);
        HttpEntity<Payment> entity = new HttpEntity<>(request, headers);

        ResponseEntity<Payment> first = rest.exchange("/api/payments", HttpMethod.POST, entity, Payment.class);
        ResponseEntity<Payment> second = rest.exchange("/api/payments", HttpMethod.POST, entity, Payment.class);

        assertThat(first.getStatusCode().value()).isEqualTo(201);
        assertThat(second.getStatusCode().value()).isEqualTo(201);
        assertThat(first.getBody()).isNotNull();
        assertThat(second.getBody()).isNotNull();
        assertThat(second.getBody().getId()).isEqualTo(first.getBody().getId());

        List<ConsumerRecord<String, String>> records = recordsForPayment(consumer, first.getBody().getId());
        assertThat(records).hasSize(1);
        assertThat(records.get(0).value()).contains("\"paymentId\":\"" + first.getBody().getId() + "\"");
        consumer.close();
    }

    private static List<ConsumerRecord<String, String>> recordsForPayment(Consumer<String, String> consumer, UUID paymentId) {
        ConsumerRecords<String, String> records = KafkaTestUtils.getRecords(consumer, Duration.ofSeconds(20));
        List<ConsumerRecord<String, String>> matchingRecords = new ArrayList<>();
        records.records("payment-events").forEach(record -> {
            if (record.value().contains("\"paymentId\":\"" + paymentId + "\"")) {
                matchingRecords.add(record);
            }
        });
        return matchingRecords;
    }

    private static Payment payment() {
        Payment payment = new Payment();
        payment.setTargetType(TargetType.BOOKING);
        payment.setTargetId(UUID.randomUUID());
        payment.setUserId(UUID.randomUUID());
        payment.setAmount(new BigDecimal("1500.00"));
        return payment;
    }
}
