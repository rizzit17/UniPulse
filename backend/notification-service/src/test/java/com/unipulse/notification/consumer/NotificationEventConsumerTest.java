package com.unipulse.notification.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.unipulse.common.event.EventEnvelope;
import com.unipulse.notification.service.KafkaDlqPublisher;
import com.unipulse.notification.service.MongoIdempotencyStore;
import com.unipulse.notification.service.NotificationEventDispatcher;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationEventConsumerTest {

    @Mock
    private MongoIdempotencyStore idempotencyStore;

    @Mock
    private KafkaDlqPublisher dlqPublisher;

    @Mock
    private NotificationEventDispatcher dispatcher;

    private ObjectMapper objectMapper;
    private NotificationEventConsumer consumer;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        consumer = new NotificationEventConsumer(objectMapper, idempotencyStore, dlqPublisher, dispatcher);
    }

    @Test
    @DisplayName("Processes new valid notification event and marks it processed")
    void shouldProcessValidNotificationEvent() throws Exception {
        UUID eventId = UUID.randomUUID();
        UUID requestId = UUID.randomUUID();

        EventEnvelope<Map<String, Object>> envelope = new EventEnvelope<>(
                eventId,
                "RequestCreated",
                1,
                Instant.now(),
                requestId,
                "corr-1",
                Map.of("requestId", requestId.toString(), "publicId", "UP-2026-000001", "requesterId", UUID.randomUUID().toString())
        );

        String json = objectMapper.writeValueAsString(envelope);
        ConsumerRecord<String, String> record = new ConsumerRecord<>(
                "request.created.v1", 0, 100L, requestId.toString(), json
        );

        when(idempotencyStore.isProcessed(NotificationEventConsumer.CONSUMER_NAME, eventId)).thenReturn(false);

        consumer.listen(record);

        verify(dispatcher).dispatch(any());
        verify(idempotencyStore).markProcessed(NotificationEventConsumer.CONSUMER_NAME, eventId);
        verify(dlqPublisher, never()).sendToDlq(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Deduplicates duplicate events using MongoIdempotencyStore")
    void shouldSkipDuplicateEvent() throws Exception {
        UUID eventId = UUID.randomUUID();
        UUID requestId = UUID.randomUUID();

        EventEnvelope<Map<String, Object>> envelope = new EventEnvelope<>(
                eventId,
                "RequestCreated",
                1,
                Instant.now(),
                requestId,
                "corr-1",
                Map.of("requestId", requestId.toString())
        );

        String json = objectMapper.writeValueAsString(envelope);
        ConsumerRecord<String, String> record = new ConsumerRecord<>(
                "request.created.v1", 0, 101L, requestId.toString(), json
        );

        when(idempotencyStore.isProcessed(NotificationEventConsumer.CONSUMER_NAME, eventId)).thenReturn(true);

        consumer.listen(record);

        verify(dispatcher, never()).dispatch(any());
        verify(idempotencyStore, never()).markProcessed(any(), any());
    }

    @Test
    @DisplayName("Routes poison message to DLQ without failing")
    void shouldRoutePoisonMessageToDlq() {
        ConsumerRecord<String, String> poison = new ConsumerRecord<>(
                "request.created.v1", 0, 102L, "key-1", "{ corrupt payload"
        );

        consumer.listen(poison);

        verify(dlqPublisher).sendToDlq(eq("request.created.v1"), eq("key-1"), eq("{ corrupt payload"), any(Exception.class), any());
        verify(dispatcher, never()).dispatch(any());
    }
}
