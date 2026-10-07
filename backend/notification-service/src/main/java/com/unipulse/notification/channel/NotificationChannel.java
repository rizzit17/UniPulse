package com.unipulse.notification.channel;

public interface NotificationChannel {

    String getChannelName();

    boolean send(NotificationMessage message);
}
