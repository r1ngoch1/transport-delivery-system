package com.ringochi.notificationservice;

public interface NotificationProvider {
    void send(NotificationMessage message);
}
