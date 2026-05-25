package com.ringochi.notificationservice;

import java.time.Instant;
import java.util.UUID;
import org.springframework.data.jpa.domain.Specification;

public final class NotificationSpecifications {
    private NotificationSpecifications() {
    }

    public static Specification<Notification> forInbox(UUID userId, NotificationType type, NotificationStatus status,
                                                       NotificationSeverity severity, Instant from, Instant to) {
        return (root, query, cb) -> {
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
            predicates.add(cb.equal(root.get("recipientUserId"), userId));
            if (type != null) {
                predicates.add(cb.equal(root.get("type"), type));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (severity != null) {
                predicates.add(cb.equal(root.get("severity"), severity));
            }
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), to));
            }
            return cb.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
    }
}
