package com.ringochi.cargoservice;

import java.math.BigDecimal;
import java.util.UUID;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "payment-service")
public interface PaymentClient {
    @PostMapping("/api/payments")
    PaymentDto create(@RequestHeader("Idempotency-Key") String idempotencyKey,
                      @RequestBody CreatePaymentRequest request);

    record CreatePaymentRequest(String targetType, UUID targetId, UUID userId, BigDecimal amount, String currency) {
    }

    record PaymentDto(UUID id, String targetType, UUID targetId, UUID userId, BigDecimal amount, String currency,
                      String status) {
    }
}
