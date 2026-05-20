package com.ringochi.paymentservice;

import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
    private final PaymentRepository payments;
    private final KafkaTemplate<String, PaymentEvent> kafkaTemplate;

    public PaymentController(PaymentRepository payments, KafkaTemplate<String, PaymentEvent> kafkaTemplate) {
        this.payments = payments;
        this.kafkaTemplate = kafkaTemplate;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Payment create(@RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
                          @RequestBody Payment request) {
        String normalizedKey = normalize(idempotencyKey);
        if (normalizedKey != null) {
            var existing = payments.findByUserIdAndIdempotencyKey(request.getUserId(), normalizedKey);
            if (existing.isPresent()) {
                if (!matches(existing.get(), request)) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "Idempotency key already used for a different payment request");
                }
                return existing.get();
            }
            request.setIdempotencyKey(normalizedKey);
        }
        request.setStatus(PaymentStatus.PENDING);
        Payment payment = payments.save(request);
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setUpdatedAt(Instant.now());
        payment = payments.save(payment);
        publish(payment, "PaymentSucceeded");
        return payment;
    }

    @GetMapping("/{id}")
    public Payment byId(@PathVariable UUID id) {
        return payments.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
    }

    @GetMapping
    public List<Payment> byTarget(TargetType targetType, UUID targetId) {
        if (targetType == null || targetId == null) {
            return payments.findAll();
        }
        return payments.findByTargetTypeAndTargetId(targetType, targetId);
    }

    private String normalize(String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return null;
        }
        return idempotencyKey.trim();
    }

    private boolean matches(Payment existing, Payment request) {
        return existing.getTargetType() == request.getTargetType()
                && Objects.equals(existing.getTargetId(), request.getTargetId())
                && Objects.equals(existing.getUserId(), request.getUserId())
                && existing.getAmount().compareTo(request.getAmount()) == 0
                && Objects.equals(existing.getCurrency(), request.getCurrency());
    }

    private void publish(Payment payment, String eventType) {
        var event = new PaymentEvent(UUID.randomUUID(), eventType, payment.getId(), payment.getTargetType(),
                payment.getTargetId(), payment.getUserId(), payment.getAmount(), Instant.now());
        kafkaTemplate.send("payment-events", payment.getTargetId().toString(), event);
    }
}
