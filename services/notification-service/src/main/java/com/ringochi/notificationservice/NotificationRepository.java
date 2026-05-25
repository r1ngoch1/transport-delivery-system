package com.ringochi.notificationservice;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface NotificationRepository extends JpaRepository<Notification, UUID>, JpaSpecificationExecutor<Notification> {
    Optional<Notification> findByEventId(UUID eventId);

    long countByRecipientUserIdAndStatus(UUID recipientUserId, NotificationStatus status);

    List<Notification> findByRecipientUserIdAndStatus(UUID recipientUserId, NotificationStatus status);
}
