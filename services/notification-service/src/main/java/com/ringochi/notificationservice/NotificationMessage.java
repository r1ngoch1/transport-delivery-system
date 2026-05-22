package com.ringochi.notificationservice;

import java.util.UUID;

public record NotificationMessage(String channel, UUID recipientUserId, String subject, String body) {
}
