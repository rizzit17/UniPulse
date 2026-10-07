package com.unipulse.notification.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.unipulse.common.event.EventEnvelope;
import com.unipulse.notification.channel.NotificationChannel;
import com.unipulse.notification.channel.NotificationChannelFactory;
import com.unipulse.notification.channel.NotificationMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationEventDispatcherTest {

    @Mock
    private NotificationChannelFactory channelFactory;

    @Mock
    private NotificationChannel inAppChannel;

    @Mock
    private NotificationChannel emailChannel;

    private NotificationEventDispatcher dispatcher;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        dispatcher = new NotificationEventDispatcher(channelFactory);
        when(channelFactory.getAllChannels()).thenReturn(List.of(inAppChannel, emailChannel));
        when(inAppChannel.send(any())).thenReturn(true);
        when(emailChannel.send(any())).thenReturn(true);
    }

    @Test
    @DisplayName("Dispatches notification to requester on RequestCreated event")
    void shouldDispatchOnRequestCreated() throws Exception {
        UUID eventId = UUID.randomUUID();
        UUID requestId = UUID.randomUUID();
        UUID requesterId = UUID.randomUUID();

        String jsonPayload = """
                {
                    "requestId": "%s",
                    "publicId": "UP-2026-000001",
                    "requesterId": "%s",
                    "requesterEmail": "student@campus.edu"
                }
                """.formatted(requestId, requesterId);
        JsonNode payloadNode = objectMapper.readTree(jsonPayload);

        EventEnvelope<JsonNode> envelope = new EventEnvelope<>(
                eventId,
                "RequestCreated",
                1,
                Instant.now(),
                requestId,
                "corr-1",
                payloadNode
        );

        int dispatched = dispatcher.dispatch(envelope);

        assertThat(dispatched).isEqualTo(2); // inApp + email

        ArgumentCaptor<NotificationMessage> captor = ArgumentCaptor.forClass(NotificationMessage.class);
        verify(inAppChannel).send(captor.capture());
        NotificationMessage msg = captor.getValue();

        assertThat(msg.userId()).isEqualTo(requesterId);
        assertThat(msg.userEmail()).isEqualTo("student@campus.edu");
        assertThat(msg.publicId()).isEqualTo("UP-2026-000001");
    }

    @Test
    @DisplayName("Dispatches notification to technician on RequestAssigned event")
    void shouldDispatchOnRequestAssigned() throws Exception {
        UUID eventId = UUID.randomUUID();
        UUID requestId = UUID.randomUUID();
        UUID techId = UUID.randomUUID();

        String jsonPayload = """
                {
                    "requestId": "%s",
                    "publicId": "UP-2026-000002",
                    "assigneeId": "%s",
                    "assigneeEmail": "tech@campus.edu"
                }
                """.formatted(requestId, techId);
        JsonNode payloadNode = objectMapper.readTree(jsonPayload);

        EventEnvelope<JsonNode> envelope = new EventEnvelope<>(
                eventId,
                "RequestAssigned",
                1,
                Instant.now(),
                requestId,
                "corr-2",
                payloadNode
        );

        int dispatched = dispatcher.dispatch(envelope);

        assertThat(dispatched).isEqualTo(2);

        ArgumentCaptor<NotificationMessage> captor = ArgumentCaptor.forClass(NotificationMessage.class);
        verify(emailChannel).send(captor.capture());
        NotificationMessage msg = captor.getValue();

        assertThat(msg.userId()).isEqualTo(techId);
        assertThat(msg.userEmail()).isEqualTo("tech@campus.edu");
        assertThat(msg.title()).contains("Task Assigned");
    }
}
