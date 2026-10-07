package com.unipulse.analytics.consumer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.unipulse.analytics.service.AnalyticsAggregationService;
import com.unipulse.analytics.service.AnalyticsIdempotencyStore;
import com.unipulse.analytics.service.KafkaDlqPublisher;
import com.unipulse.common.event.EventEnvelope;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnalyticsEventConsumerTest {

    @Mock
    private AnalyticsIdempotencyStore idempotencyStore;

    @Mock
    private KafkaDlqPublisher dlqPublisher;

    @Mock
    private AnalyticsAggregationService aggregationService;

    private ObjectMapper objectMapper;
    private AnalyticsEventConsumer consumer;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        consumer = new AnalyticsEventConsumer(
                objectMapper,
                idempotencyStore,
                dlqPublisher,
                aggregationService
        );
    }

    @Test
    @DisplayName("Processes event when not already processed in idempotency store")
    void shouldProcessEventSuccessfully() throws Exception {
        UUID eventId = UUID.randomUUID();
        UUID reqId = UUID.randomUUID();
        JsonNode payload = objectMapper.readTree("{\"publicId\":\"UP-2026-000200\"}");
        EventEnvelope<JsonNode> envelope = EventEnvelope.of("request.created.v1", reqId, "corr-test", payload);

        when(idempotencyStore.isProcessed(eq(AnalyticsEventConsumer.CONSUMER_NAME), any())).thenReturn(false);

        String recordJson = objectMapper.writeValueAsString(envelope);
        ConsumerRecord<String, String> record = new ConsumerRecord<>("request.created.v1", 0, 0L, reqId.toString(), recordJson);

        consumer.listen(record);

        verify(aggregationService).processEvent(any());
        verify(idempotencyStore).markProcessed(eq(AnalyticsEventConsumer.CONSUMER_NAME), any());
        verifyNoInteractions(dlqPublisher);
    }

    @Test
    @DisplayName("Skips event when already processed according to idempotency store")
    void shouldSkipAlreadyProcessedEvent() throws Exception {
        UUID reqId = UUID.randomUUID();
        JsonNode payload = objectMapper.readTree("{\"publicId\":\"UP-2026-000201\"}");
        EventEnvelope<JsonNode> envelope = EventEnvelope.of("request.created.v1", reqId, "corr-test", payload);

        when(idempotencyStore.isProcessed(eq(AnalyticsEventConsumer.CONSUMER_NAME), any())).thenReturn(true);

        String recordJson = objectMapper.writeValueAsString(envelope);
        ConsumerRecord<String, String> record = new ConsumerRecord<>("request.created.v1", 0, 0L, reqId.toString(), recordJson);

        consumer.listen(record);

        verifyNoInteractions(aggregationService);
        verify(idempotencyStore, never()).markProcessed(any(), any());
        verifyNoInteractions(dlqPublisher);
    }

    @Test
    @DisplayName("Routes poison pill payload to DLQ without failing thread")
    void shouldRoutePoisonPillToDlq() {
        ConsumerRecord<String, String> record = new ConsumerRecord<>(
                "request.created.v1", 0, 0L, "bad-key", "{invalid json..."
        );

        consumer.listen(record);

        verify(dlqPublisher).sendToDlq(eq("request.created.v1"), eq("bad-key"), eq("{invalid json..."), any(), any());
        verifyNoInteractions(aggregationService);
    }
}
