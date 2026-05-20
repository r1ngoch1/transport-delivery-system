package com.ringochi.paymentservice;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    List<Payment> findByTargetTypeAndTargetId(TargetType targetType, UUID targetId);
    Optional<Payment> findByUserIdAndIdempotencyKey(UUID userId, String idempotencyKey);
}
