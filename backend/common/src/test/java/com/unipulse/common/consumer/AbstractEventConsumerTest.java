package com.unipulse.common.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.unipulse.common.event.EventEnvelope;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AbstractEventConsumerTest {

    private ObjectMapper objectMapper;
    private IdempotencyStore idempotencyStore;

    @Mock
    private DlqPublisher dlqPublisher;

    private TestConsumer testConsumer;
    private AtomicInteger executionCount;

    record SamplePayload(String name, int value) {}

    static class TestConsumer extends AbstractEventConsumer<SamplePayload> {
        private final AtomicInteger counter;
        private boolean shouldFail = false;

        TestConsumer(ObjectMapper objectMapper, IdempotencyStore idempotencyStore, DlqPublisher dlqPublisher, AtomicInteger counter) {
            super(objectMapper, idempotencyStore, dlqPublisher, SamplePayload.class);
            this.counter = counter;
        }

        void setShouldFail(boolean fail) {
            this.shouldFail = fail;
        }

        @Override
        public String getConsumerName() {
            return "test-consumer";
        }

        @Override
        protected void process(EventEnvelope<SamplePayload> envelope) throws Exception {
            if (shouldFail) {
                throw new IllegalStateException("Simulated processing failure");
            }
            counter.incrementAndGet();
        }
    }

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        idempotencyStore = new InMemoryIdempotencyStore();
        executionCount = new AtomicInteger(0);
        testConsumer = new TestConsumer(objectMapper, idempotencyStore, dlqPublisher, executionCount);
    }

    @Test
    @DisplayName("Successfully processes message on first delivery")
    void shouldProcessMessageSuccessfully() throws Exception {
        UUID eventId = UUID.randomUUID();
        UUID aggregateId = UUID.randomUUID();
        EventEnvelope<SamplePayload> envelope = EventEnvelope.of(
                "SampleEvent",
                aggregateId,
                "corr-123",
                new SamplePayload("Alpha", 42)
        );
        String json = objectMapper.writeValueAsString(envelope);
        ConsumerRecord<String, String> record = new ConsumerRecord<>("test.topic", 0, 0L, aggregateId.toString(), json);

        testConsumer.onMessage(record);

        assertThat(executionCount.get()).isEqualTo(1);
        assertThat(idempotencyStore.isProcessed("test-consumer", envelope.eventId())).isTrue();
    }

    @Test
    @DisplayName("Duplicate message delivery is skipped without re-executing logic")
    void shouldSkipDuplicateEventDeliveries() throws Exception {
        UUID aggregateId = UUID.randomUUID();
        EventEnvelope<SamplePayload> envelope = EventEnvelope.of(
                "SampleEvent",
                aggregateId,
                "corr-123",
                new SamplePayload("Beta", 99)
        );
        String json = objectMapper.writeValueAsString(envelope);
        ConsumerRecord<String, String> record = new ConsumerRecord<>("test.topic", 0, 0L, aggregateId.toString(), json);

        // First delivery
        testConsumer.onMessage(record);
        assertThat(executionCount.get()).isEqualTo(1);

        // Redelivery / duplicate delivery
        testConsumer.onMessage(record);
        assertThat(executionCount.get()).isEqualTo(1); // Still 1!
        verifyNoInteractions(dlqPublisher);
    }

    @Test
    @DisplayName("Failure during processing routes poison message to DLQ")
    void shouldRouteToDlqOnProcessingError() throws Exception {
        testConsumer.setShouldFail(true);

        UUID aggregateId = UUID.randomUUID();
        EventEnvelope<SamplePayload> envelope = EventEnvelope.of(
                "SampleEvent",
                aggregateId,
                "corr-error",
                new SamplePayload("Gamma", 0)
        );
        String json = objectMapper.writeValueAsString(envelope);
        ConsumerRecord<String, String> record = new ConsumerRecord<>("test.topic", 0, 0L, aggregateId.toString(), json);

        testConsumer.onMessage(record);

        assertThat(executionCount.get()).isEqualTo(0);
        assertThat(idempotencyStore.isProcessed("test-consumer", envelope.eventId())).isFalse();

        ArgumentCaptor<Map<String, String>> headersCaptor = ArgumentCaptor.forClass(Map.class);
        verify(dlqPublisher).sendToDlq(
                eq("test.topic"),
                eq(aggregateId.toString()),
                eq(json),
                any(IllegalStateException.class),
                headersCaptor.capture()
        );

        Map<String, String> capturedHeaders = headersCaptor.getValue();
        assertThat(capturedHeaders).containsEntry("x-consumer", "test-consumer");
        assertThat(capturedHeaders).containsEntry("x-correlation-id", "corr-error");
        assertThat(capturedHeaders).containsEntry("x-error-class", IllegalStateException.class.getName());
    }
}
