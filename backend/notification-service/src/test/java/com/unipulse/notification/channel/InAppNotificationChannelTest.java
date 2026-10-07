package com.unipulse.notification.channel;

import com.unipulse.notification.domain.NotificationDocument;
import com.unipulse.notification.repo.NotificationRepository;
import com.unipulse.notification.service.SseEmitterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DuplicateKeyException;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InAppNotificationChannelTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private SseEmitterRegistry sseEmitterRegistry;

    private InAppNotificationChannel channel;

    @BeforeEach
    void setUp() {
        channel = new InAppNotificationChannel(notificationRepository, sseEmitterRegistry);
    }

    @Test
    @DisplayName("Saves in-app notification in MongoDB and emits via SSE")
    void shouldSaveAndEmitInAppNotification() {
        UUID eventId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID requestId = UUID.randomUUID();

        NotificationMessage message = NotificationMessage.of(
                eventId,
                userId,
                "user@example.com",
                requestId,
                "UP-2026-000001",
                "Request Created",
                "Your request has been created."
        );

        boolean result = channel.send(message);

        assertThat(result).isTrue();

        ArgumentCaptor<NotificationDocument> captor = ArgumentCaptor.forClass(NotificationDocument.class);
        verify(notificationRepository).save(captor.capture());

        NotificationDocument saved = captor.getValue();
        assertThat(saved.getEventId()).isEqualTo(eventId);
        assertThat(saved.getUserId()).isEqualTo(userId);
        assertThat(saved.getPublicId()).isEqualTo("UP-2026-000001");
        assertThat(saved.getChannel()).isEqualTo("IN_APP");
        assertThat(saved.getStatus()).isEqualTo("DELIVERED");

        verify(sseEmitterRegistry).sendToUser(eq(userId), eq("NOTIFICATION"), any());
    }

    @Test
    @DisplayName("Handles duplicate key gracefully without failing")
    void shouldHandleDuplicateKeyGracefully() {
        UUID userId = UUID.randomUUID();
        NotificationMessage message = NotificationMessage.of(
                UUID.randomUUID(),
                userId,
                "user@example.com",
                UUID.randomUUID(),
                "UP-2026-000001",
                "Request Created",
                "Your request has been created."
        );

        when(notificationRepository.save(any())).thenThrow(new DuplicateKeyException("Duplicate key"));

        boolean result = channel.send(message);

        assertThat(result).isTrue();
    }
}
