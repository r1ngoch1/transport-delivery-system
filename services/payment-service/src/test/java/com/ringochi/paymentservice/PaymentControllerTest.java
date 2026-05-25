package com.ringochi.paymentservice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class PaymentControllerTest {
    @Mock
    private PaymentRepository payments;
    @Mock
    private KafkaTemplate<String, PaymentEvent> kafkaTemplate;

    private PaymentController controller;

    @BeforeEach
    void setUp() {
        controller = new PaymentController(payments, kafkaTemplate);
    }

    @Test
    void createMovesPaymentFromPendingToSuccessAndPublishesKafkaEvent() {
        Payment request = payment(TargetType.BOOKING, UUID.randomUUID(), UUID.randomUUID(), "1200.00");
        AtomicInteger saveCount = new AtomicInteger();
        when(payments.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment payment = invocation.getArgument(0);
            if (saveCount.getAndIncrement() == 0) {
                assertThat(payment.getStatus()).isEqualTo(PaymentStatus.PENDING);
            } else {
                assertThat(payment.getStatus()).isEqualTo(PaymentStatus.SUCCESS);
            }
            return payment;
        });

        Payment result = controller.create(null, request);

        ArgumentCaptor<Payment> paymentCaptor = ArgumentCaptor.forClass(Payment.class);
        verify(payments, org.mockito.Mockito.times(2)).save(paymentCaptor.capture());
        assertThat(saveCount).hasValue(2);
        assertThat(result.getStatus()).isEqualTo(PaymentStatus.SUCCESS);
        assertThat(result.getUpdatedAt()).isAfterOrEqualTo(result.getCreatedAt());

        ArgumentCaptor<PaymentEvent> eventCaptor = ArgumentCaptor.forClass(PaymentEvent.class);
        verify(kafkaTemplate).send(org.mockito.Mockito.eq("payment-events"), org.mockito.Mockito.eq(request.getTargetId().toString()),
                eventCaptor.capture());
        PaymentEvent event = eventCaptor.getValue();
        assertThat(event.eventType()).isEqualTo("PaymentSucceeded");
        assertThat(event.paymentId()).isEqualTo(result.getId());
        assertThat(event.targetType()).isEqualTo(request.getTargetType());
        assertThat(event.targetId()).isEqualTo(request.getTargetId());
        assertThat(event.userId()).isEqualTo(request.getUserId());
        assertThat(event.amount()).isEqualByComparingTo(request.getAmount());
    }

    @Test
    void repeatedCreateWithSameIdempotencyKeyReturnsExistingPaymentWithoutPublishingKafkaEvent() {
        String idempotencyKey = "payment-key-1";
        Payment request = payment(TargetType.BOOKING, UUID.randomUUID(), UUID.randomUUID(), "1200.00");
        Payment existing = payment(request.getTargetType(), request.getTargetId(), request.getUserId(), "1200.00");
        existing.setIdempotencyKey(idempotencyKey);
        existing.setStatus(PaymentStatus.SUCCESS);
        when(payments.findByUserIdAndIdempotencyKey(request.getUserId(), idempotencyKey)).thenReturn(Optional.of(existing));

        Payment result = controller.create(idempotencyKey, request);

        assertThat(result).isSameAs(existing);
        verify(payments, never()).save(any(Payment.class));
        verify(kafkaTemplate, never()).send(any(), any(), any());
    }

    @Test
    void repeatedCreateWithSameIdempotencyKeyAndDifferentRequestFailsWithConflict() {
        String idempotencyKey = "payment-key-1";
        Payment request = payment(TargetType.BOOKING, UUID.randomUUID(), UUID.randomUUID(), "1200.00");
        Payment existing = payment(TargetType.BOOKING, UUID.randomUUID(), request.getUserId(), "1200.00");
        existing.setIdempotencyKey(idempotencyKey);
        existing.setStatus(PaymentStatus.SUCCESS);
        when(payments.findByUserIdAndIdempotencyKey(request.getUserId(), idempotencyKey)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> controller.create(idempotencyKey, request))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception -> {
                    assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(exception.getReason()).isEqualTo("Idempotency key already used for a different payment request");
                });

        verify(payments, never()).save(any(Payment.class));
        verify(kafkaTemplate, never()).send(any(), any(), any());
    }

    @Test
    void byTargetReturnsAllPaymentsWhenFilterIsMissing() {
        Payment payment = payment(TargetType.BOOKING, UUID.randomUUID(), UUID.randomUUID(), "1200.00");
        when(payments.findAll(anyPaymentSpec(), any(Pageable.class))).thenReturn(new PageImpl<>(List.of(payment)));

        List<Payment> result = controller.byTarget(null, null, payment.getTargetId(), null, 0, 50);

        assertThat(result).containsExactly(payment);
        verify(payments).findAll(anyPaymentSpec(), any(Pageable.class));
    }

    @Test
    void byTargetFiltersByTypeAndId() {
        UUID targetId = UUID.randomUUID();
        Payment payment = payment(TargetType.BOOKING, targetId, UUID.randomUUID(), "1200.00");
        when(payments.findAll(anyPaymentSpec(), any(Pageable.class))).thenReturn(new PageImpl<>(List.of(payment)));

        List<Payment> result = controller.byTarget(null, TargetType.BOOKING, targetId, null, 0, 50);

        assertThat(result).containsExactly(payment);
        verify(payments).findAll(anyPaymentSpec(), any(Pageable.class));
    }

    @Test
    void byTargetSupportsAdminFiltersAndPaging() {
        UUID targetId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        Payment payment = payment(TargetType.BOOKING, targetId, userId, "1200.00");
        payment.setStatus(PaymentStatus.SUCCESS);
        when(payments.findAll(anyPaymentSpec(), any(Pageable.class))).thenReturn(new PageImpl<>(List.of(payment)));

        List<Payment> result = controller.byTarget(PaymentStatus.SUCCESS, TargetType.BOOKING, targetId, userId, 1, 10);

        assertThat(result).containsExactly(payment);
        verify(payments).findAll(anyPaymentSpec(), any(Pageable.class));
    }

    private static Payment payment(TargetType targetType, UUID targetId, UUID userId, String amount) {
        Payment payment = new Payment();
        payment.setTargetType(targetType);
        payment.setTargetId(targetId);
        payment.setUserId(userId);
        payment.setAmount(new BigDecimal(amount));
        return payment;
    }

    @SuppressWarnings("unchecked")
    private static Specification<Payment> anyPaymentSpec() {
        return any(Specification.class);
    }
}
