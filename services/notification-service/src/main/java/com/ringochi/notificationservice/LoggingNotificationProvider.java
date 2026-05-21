package com.ringochi.notificationservice;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class LoggingNotificationProvider implements NotificationProvider {
    private static final Logger log = LoggerFactory.getLogger(LoggingNotificationProvider.class);

    @Override
    public void send(NotificationMessage message) {
        log.info("notification channel={} recipientUserId={} subject={} body={}",
                message.channel(), message.recipientUserId(), message.subject(), message.body());
    }
}
