package com.ringochi.paymentservice;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PaymentEvent(UUID eventId, String eventType, UUID paymentId, TargetType targetType, UUID targetId,
                           UUID userId, BigDecimal amount, Instant occurredAt) {
}
