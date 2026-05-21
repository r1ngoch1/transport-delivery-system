package com.ringochi.notificationservice;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PaymentEvent(UUID eventId, String eventType, UUID paymentId, String targetType, UUID targetId,
                           UUID userId, BigDecimal amount, Instant occurredAt) {
}
