package com.ringochi.paymentservice;

import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
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
    public List<Payment> byTarget(@RequestParam(required = false) PaymentStatus status,
                                  @RequestParam(required = false) TargetType targetType,
                                  @RequestParam(required = false) UUID targetId,
                                  @RequestParam(required = false) UUID userId,
                                  @RequestParam(defaultValue = "0") int page,
                                  @RequestParam(defaultValue = "50") int size) {
        var pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return payments.findAll(paymentSpec(status, targetType, targetId, userId), pageable).getContent();
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

    private Specification<Payment> paymentSpec(PaymentStatus status, TargetType targetType, UUID targetId, UUID userId) {
        return (root, query, cb) -> {
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (targetType != null) {
                predicates.add(cb.equal(root.get("targetType"), targetType));
            }
            if (targetId != null) {
                predicates.add(cb.equal(root.get("targetId"), targetId));
            }
            if (userId != null) {
                predicates.add(cb.equal(root.get("userId"), userId));
            }
            return cb.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
    }
}
