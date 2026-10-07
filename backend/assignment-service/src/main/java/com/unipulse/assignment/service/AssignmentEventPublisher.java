package com.unipulse.assignment.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.unipulse.common.event.EventEnvelope;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AssignmentEventPublisher {

    public static final String TOPIC_REQUEST_ASSIGNED = "request.assigned.v1";

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public void publishRequestAssigned(UUID requestId, String publicId, UUID assigneeId, String correlationId) {
        try {
            Map<String, Object> payload = Map.of(
                    "requestId", requestId.toString(),
                    "publicId", publicId != null ? publicId : "",
                    "assigneeId", assigneeId.toString(),
                    "assignedAt", Instant.now().toString()
            );

            EventEnvelope<Map<String, Object>> envelope = EventEnvelope.of(
                    "RequestAssigned",
                    requestId,
                    correlationId,
                    payload
            );

            String json = objectMapper.writeValueAsString(envelope);
            kafkaTemplate.send(TOPIC_REQUEST_ASSIGNED, requestId.toString(), json);
            log.info("Published RequestAssigned event for request {} -> assignee {}", requestId, assigneeId);

        } catch (Exception e) {
            log.error("Failed to publish RequestAssigned event for request {}: {}", requestId, e.getMessage(), e);
        }
    }
}
