package com.unipulse.notification.channel;

import java.util.Map;
import java.util.UUID;

public record NotificationMessage(
        UUID eventId,
        UUID userId,
        String userEmail,
        UUID requestId,
        String publicId,
        String title,
        String body,
        Map<String, Object> metadata
) {
    public static NotificationMessage of(
            UUID eventId,
            UUID userId,
            String userEmail,
            UUID requestId,
            String publicId,
            String title,
            String body
    ) {
        return new NotificationMessage(eventId, userId, userEmail, requestId, publicId, title, body, Map.of());
    }
}
