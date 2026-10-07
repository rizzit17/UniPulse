package com.unipulse.core.outbox;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.unipulse.common.event.EventEnvelope;
import com.unipulse.core.request.domain.OutboxEvent;
import com.unipulse.core.request.repo.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.PageRequest;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
@ConditionalOnProperty(prefix = "unipulse.outbox", name = "enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
public class OutboxRelay {

    private final OutboxEventRepository outboxEventRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @Value("${unipulse.outbox.batch-size:100}")
    private int batchSize = 100;

    @Value("${unipulse.outbox.send-timeout-seconds:5}")
    private int sendTimeoutSeconds = 5;

    @Value("${unipulse.outbox.retention-days:7}")
    private int retentionDays = 7;

    /**
     * Poll unpublished outbox events using SKIP LOCKED and publish to Kafka.
     */
    @Scheduled(fixedDelayString = "${unipulse.outbox.poll-interval-ms:500}")
    @Transactional
    public void relayEvents() {
        List<OutboxEvent> pending = outboxEventRepository.findPendingEventsForUpdate(PageRequest.of(0, batchSize));
        if (pending.isEmpty()) {
            return;
        }

        log.debug("Found {} pending outbox events to relay", pending.size());

        for (OutboxEvent event : pending) {
            try {
                String topic = resolveTopic(event.getType());
                String key = event.getAggregateId().toString();

                String correlationId = MDC.get("correlationId");
                if (correlationId == null || correlationId.isBlank()) {
                    correlationId = UUID.randomUUID().toString();
                }

                JsonNode payloadNode = objectMapper.readTree(event.getPayload());
                EventEnvelope<JsonNode> envelope = new EventEnvelope<>(
                        event.getId(),
                        event.getType(),
                        1,
                        event.getCreatedAt(),
                        event.getAggregateId(),
                        correlationId,
                        payloadNode
                );

                String serializedEnvelope = objectMapper.writeValueAsString(envelope);
                CompletableFuture<SendResult<String, String>> future = kafkaTemplate.send(topic, key, serializedEnvelope);

                // Wait for Kafka broker ACK (producer acks=all guarantees durability)
                future.get(sendTimeoutSeconds, TimeUnit.SECONDS);

                event.setPublishedAt(Instant.now());
                log.info("Relayed outbox event {} of type {} to Kafka topic {} [key={}]",
                        event.getId(), event.getType(), topic, key);

            } catch (Exception ex) {
                log.error("Failed to relay outbox event {} [type={}]: {}", event.getId(), event.getType(), ex.getMessage());
                // Leave publishedAt null; will be retried on next poll cycle
                break;
            }
        }
    }

    /**
     * Periodic cleanup of published outbox events older than the retention threshold.
     */
    @Scheduled(cron = "${unipulse.outbox.cleanup-cron:0 0 2 * * *}")
    @Transactional
    public void cleanupOldEvents() {
        Instant cutoff = Instant.now().minus(retentionDays, ChronoUnit.DAYS);
        int deleted = outboxEventRepository.deletePublishedBefore(cutoff);
        if (deleted > 0) {
            log.info("Cleaned up {} published outbox events older than {} days", deleted, retentionDays);
        }
    }

    public static String resolveTopic(String eventType) {
        return switch (eventType) {
            case "RequestCreated" -> "request.created.v1";
            case "RequestAssigned" -> "request.assigned.v1";
            case "RequestStatusChanged" -> "request.status-changed.v1";
            case "RequestCommentAdded" -> "request.comment-added.v1";
            case "SlaWarning" -> "sla.warning.v1";
            case "SlaBreached" -> "sla.breached.v1";
            default -> "request.events.v1";
        };
    }
}
