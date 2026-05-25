package com.ringochi.notificationservice;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationRepository notifications;

    public NotificationController(NotificationRepository notifications) {
        this.notifications = notifications;
    }

    @GetMapping
    public List<Notification> list(@RequestHeader("X-User-Id") UUID userId,
                                   @RequestHeader(value = "X-User-Roles", required = false) String roles,
                                   @RequestParam(required = false) NotificationType type,
                                   @RequestParam(required = false) NotificationStatus status,
                                   @RequestParam(required = false) NotificationSeverity severity,
                                   @RequestParam(required = false) Instant from,
                                   @RequestParam(required = false) Instant to,
                                   @RequestParam(defaultValue = "0") int page,
                                   @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return notifications.findAll(NotificationSpecifications.forInbox(userId, type, status, severity, from, to),
                pageable).getContent();
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount(@RequestHeader("X-User-Id") UUID userId) {
        return Map.of("unreadCount", notifications.countByRecipientUserIdAndStatus(userId, NotificationStatus.UNREAD));
    }

    @GetMapping("/{id}")
    public Notification byId(@RequestHeader("X-User-Id") UUID userId, @PathVariable UUID id) {
        Notification notification = notifications.findById(id).orElseThrow(() -> notFound());
        assertOwner(userId, notification);
        return notification;
    }

    @PatchMapping("/{id}/read")
    public Notification markRead(@RequestHeader("X-User-Id") UUID userId, @PathVariable UUID id) {
        Notification notification = byId(userId, id);
        notification.setStatus(NotificationStatus.READ);
        notification.setReadAt(Instant.now());
        return notifications.save(notification);
    }

    @PatchMapping("/read-all")
    public Map<String, Integer> markAllRead(@RequestHeader("X-User-Id") UUID userId) {
        List<Notification> unread = notifications.findByRecipientUserIdAndStatus(userId, NotificationStatus.UNREAD);
        Instant readAt = Instant.now();
        unread.forEach(notification -> {
            notification.setStatus(NotificationStatus.READ);
            notification.setReadAt(readAt);
        });
        notifications.saveAll(unread);
        return Map.of("updatedCount", unread.size());
    }

    private void assertOwner(UUID userId, Notification notification) {
        if (!userId.equals(notification.getRecipientUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot access another user's notification");
        }
    }

    private ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found");
    }
}
