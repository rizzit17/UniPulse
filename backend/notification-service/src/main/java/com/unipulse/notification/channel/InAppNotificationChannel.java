package com.unipulse.notification.channel;

import com.unipulse.notification.domain.NotificationDocument;
import com.unipulse.notification.repo.NotificationRepository;
import com.unipulse.notification.service.SseEmitterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class InAppNotificationChannel implements NotificationChannel {

    public static final String CHANNEL_NAME = "IN_APP";

    private final NotificationRepository notificationRepository;
    private final SseEmitterRegistry sseEmitterRegistry;

    @Override
    public String getChannelName() {
        return CHANNEL_NAME;
    }

    @Override
    public boolean send(NotificationMessage message) {
        log.info("Dispatching in-app notification to user {} for request {}", message.userId(), message.publicId());

        try {
            Instant now = Instant.now();
            NotificationDocument doc = NotificationDocument.builder()
                    .eventId(message.eventId())
                    .userId(message.userId())
                    .userEmail(message.userEmail())
                    .requestId(message.requestId())
                    .publicId(message.publicId())
                    .title(message.title())
                    .message(message.body())
                    .channel(CHANNEL_NAME)
                    .status("DELIVERED")
                    .metadata(message.metadata())
                    .createdAt(now)
                    .deliveredAt(now)
                    .build();

            notificationRepository.save(doc);

            // Push to active SSE clients
            sseEmitterRegistry.sendToUser(message.userId(), "NOTIFICATION", Map.of(
                    "id", doc.getId() != null ? doc.getId() : "",
                    "requestId", message.requestId(),
                    "publicId", message.publicId(),
                    "title", message.title(),
                    "message", message.body(),
                    "createdAt", now.toString()
            ));

            return true;
        } catch (DuplicateKeyException e) {
            log.warn("In-app notification already recorded for event {} and user {}", message.eventId(), message.userId());
            return true;
        } catch (Exception e) {
            log.error("Failed to persist and stream in-app notification: {}", e.getMessage(), e);
            return false;
        }
    }
}
