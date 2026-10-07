package com.unipulse.core.outbox;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.unipulse.core.request.domain.OutboxEvent;
import com.unipulse.core.request.repo.OutboxEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OutboxRelayTest {

    @Mock
    private OutboxEventRepository outboxEventRepository;

    @Mock
    private KafkaTemplate<String, String> kafkaTemplate;

    private ObjectMapper objectMapper;
    private OutboxRelay outboxRelay;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
        objectMapper.disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        outboxRelay = new OutboxRelay(outboxEventRepository, kafkaTemplate, objectMapper);
        ReflectionTestUtils.setField(outboxRelay, "batchSize", 50);
        ReflectionTestUtils.setField(outboxRelay, "sendTimeoutSeconds", 5);
        ReflectionTestUtils.setField(outboxRelay, "retentionDays", 7);
    }

    @Test
    @DisplayName("Topic resolution correctly maps all UniPulse domain event types")
    void shouldResolveTopicsCorrectly() {
        assertThat(OutboxRelay.resolveTopic("RequestCreated")).isEqualTo("request.created.v1");
        assertThat(OutboxRelay.resolveTopic("RequestAssigned")).isEqualTo("request.assigned.v1");
        assertThat(OutboxRelay.resolveTopic("RequestStatusChanged")).isEqualTo("request.status-changed.v1");
        assertThat(OutboxRelay.resolveTopic("RequestCommentAdded")).isEqualTo("request.comment-added.v1");
        assertThat(OutboxRelay.resolveTopic("SlaWarning")).isEqualTo("sla.warning.v1");
        assertThat(OutboxRelay.resolveTopic("SlaBreached")).isEqualTo("sla.breached.v1");
        assertThat(OutboxRelay.resolveTopic("UnknownEvent")).isEqualTo("request.events.v1");
    }

    @Test
    @DisplayName("Relays pending events and marks publishedAt on broker ACK")
    void shouldRelayPendingEventsSuccessfully() {
        UUID aggregateId = UUID.randomUUID();
        OutboxEvent event = OutboxEvent.builder()
                .id(UUID.randomUUID())
                .aggregateId(aggregateId)
                .type("RequestCreated")
                .payload("{\"requestId\":\"" + aggregateId + "\",\"title\":\"AC Leak\"}")
                .createdAt(Instant.now())
                .build();

        when(outboxEventRepository.findPendingEventsForUpdate(any(Pageable.class)))
                .thenReturn(List.of(event));

        CompletableFuture<SendResult<String, String>> future = CompletableFuture.completedFuture(mock(SendResult.class));
        when(kafkaTemplate.send(eq("request.created.v1"), eq(aggregateId.toString()), any(String.class)))
                .thenReturn(future);

        outboxRelay.relayEvents();

        assertThat(event.getPublishedAt()).isNotNull();

        ArgumentCaptor<String> payloadCaptor = ArgumentCaptor.forClass(String.class);
        verify(kafkaTemplate).send(eq("request.created.v1"), eq(aggregateId.toString()), payloadCaptor.capture());
        assertThat(payloadCaptor.getValue()).contains("RequestCreated");
        assertThat(payloadCaptor.getValue()).contains("AC Leak");
    }

    @Test
    @DisplayName("Leaves publishedAt null when Kafka send fails")
    void shouldNotMarkPublishedWhenSendFails() {
        UUID aggregateId = UUID.randomUUID();
        OutboxEvent event = OutboxEvent.builder()
                .id(UUID.randomUUID())
                .aggregateId(aggregateId)
                .type("RequestCreated")
                .payload("{\"requestId\":\"" + aggregateId + "\"}")
                .createdAt(Instant.now())
                .build();

        when(outboxEventRepository.findPendingEventsForUpdate(any(Pageable.class)))
                .thenReturn(List.of(event));

        CompletableFuture<SendResult<String, String>> failedFuture = new CompletableFuture<>();
        failedFuture.completeExceptionally(new RuntimeException("Kafka broker unreachable"));
        when(kafkaTemplate.send(any(), any(), any())).thenReturn(failedFuture);

        outboxRelay.relayEvents();

        assertThat(event.getPublishedAt()).isNull();
    }

    @Test
    @DisplayName("Cleans up published events older than retention cutoff")
    void shouldCleanupOldPublishedEvents() {
        when(outboxEventRepository.deletePublishedBefore(any(Instant.class))).thenReturn(15);

        outboxRelay.cleanupOldEvents();

        verify(outboxEventRepository).deletePublishedBefore(any(Instant.class));
    }
}
