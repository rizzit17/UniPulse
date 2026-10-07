package com.unipulse.assignment.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.unipulse.assignment.dto.RequestCreatedPayload;
import com.unipulse.assignment.service.AssignmentProcessor;
import com.unipulse.assignment.service.JpaIdempotencyStore;
import com.unipulse.assignment.service.KafkaDlqPublisher;
import com.unipulse.common.event.EventEnvelope;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RequestCreatedConsumerTest {

    @Mock
    private JpaIdempotencyStore idempotencyStore;

    @Mock
    private KafkaDlqPublisher dlqPublisher;

    @Mock
    private AssignmentProcessor assignmentProcessor;

    private ObjectMapper objectMapper;
    private RequestCreatedConsumer consumer;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        consumer = new RequestCreatedConsumer(objectMapper, idempotencyStore, dlqPublisher, assignmentProcessor);
    }

    @Test
    @DisplayName("Processes new valid RequestCreated event and marks it processed")
    void shouldProcessValidEvent() throws Exception {
        UUID eventId = UUID.randomUUID();
        UUID requestId = UUID.randomUUID();
        RequestCreatedPayload payload = new RequestCreatedPayload(
                requestId,
                "UP-2026-000001",
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                "P1",
                "Science Block"
        );
        EventEnvelope<RequestCreatedPayload> envelope = new EventEnvelope<>(
                eventId,
                "request.created.v1",
                1,
                Instant.now(),
                requestId,
                "corr-123",
                payload
        );
        String json = objectMapper.writeValueAsString(envelope);
        ConsumerRecord<String, String> record = new ConsumerRecord<>(
                "request.created.v1", 0, 100L, requestId.toString(), json
        );

        when(idempotencyStore.isProcessed(RequestCreatedConsumer.CONSUMER_NAME, eventId)).thenReturn(false);

        consumer.listen(record);

        verify(assignmentProcessor).assignRequest(eq(payload), eq("corr-123"));
        verify(idempotencyStore).markProcessed(RequestCreatedConsumer.CONSUMER_NAME, eventId);
        verify(dlqPublisher, never()).sendToDlq(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Skips event when already processed by idempotency store")
    void shouldSkipAlreadyProcessedEvent() throws Exception {
        UUID eventId = UUID.randomUUID();
        UUID requestId = UUID.randomUUID();
        RequestCreatedPayload payload = new RequestCreatedPayload(
                requestId,
                "UP-2026-000001",
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                "P2",
                "Main Block"
        );
        EventEnvelope<RequestCreatedPayload> envelope = new EventEnvelope<>(
                eventId,
                "request.created.v1",
                1,
                Instant.now(),
                requestId,
                "corr-456",
                payload
        );
        String json = objectMapper.writeValueAsString(envelope);
        ConsumerRecord<String, String> record = new ConsumerRecord<>(
                "request.created.v1", 0, 101L, requestId.toString(), json
        );

        when(idempotencyStore.isProcessed(RequestCreatedConsumer.CONSUMER_NAME, eventId)).thenReturn(true);

        consumer.listen(record);

        verify(assignmentProcessor, never()).assignRequest(any(), any());
        verify(idempotencyStore, never()).markProcessed(any(), any());
    }

    @Test
    @DisplayName("Routes unparseable record to DLQ without crashing")
    void shouldRouteMalformedRecordToDlq() {
        ConsumerRecord<String, String> malformedRecord = new ConsumerRecord<>(
                "request.created.v1", 0, 102L, "key-1", "{ invalid json"
        );

        consumer.listen(malformedRecord);

        verify(dlqPublisher).sendToDlq(eq("request.created.v1"), eq("key-1"), eq("{ invalid json"), any(Exception.class), any());
        verify(assignmentProcessor, never()).assignRequest(any(), any());
    }
}
