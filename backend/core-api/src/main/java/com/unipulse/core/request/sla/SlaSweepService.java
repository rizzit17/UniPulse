package com.unipulse.core.request.sla;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.unipulse.common.event.EventEnvelope;
import com.unipulse.core.request.domain.OutboxEvent;
import com.unipulse.core.request.domain.RequestHistory;
import com.unipulse.core.request.domain.ServiceRequest;
import com.unipulse.core.request.repo.OutboxEventRepository;
import com.unipulse.core.request.repo.RequestHistoryRepository;
import com.unipulse.core.request.repo.ServiceRequestRepository;
import com.unipulse.core.shared.cache.RedisCacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SlaSweepService {

    private static final int BATCH_SIZE = 500;
    private static final Duration WARNING_WINDOW = Duration.ofMinutes(60); // warning threshold

    private final ServiceRequestRepository requestRepository;
    private final RequestHistoryRepository historyRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final EscalationChain escalationChain;
    private final RedisCacheService cacheService;
    private final ObjectMapper objectMapper;

    @Transactional
    public SlaSweepResult sweep() {
        Instant now = Instant.now();
        log.info("Starting SLA sweep at {}", now);

        int warningsIssued = 0;
        int breachesEscalated = 0;

        // 1. Scan for near-deadline requests (SLA warning: resolve_by within warning window, escalation_level = 0)
        Instant warningThreshold = now.plus(WARNING_WINDOW);
        List<ServiceRequest> warningCandidates = requestRepository.findWarningRequests(
                now, warningThreshold, PageRequest.of(0, BATCH_SIZE)
        );

        for (ServiceRequest request : warningCandidates) {
            publishOutbox(request.getId(), "SlaWarning", Map.of(
                    "requestId", request.getId(),
                    "publicId", request.getPublicId(),
                    "resolveBy", request.getResolveBy().toString(),
                    "assigneeId", request.getAssigneeId() != null ? request.getAssigneeId() : "",
                    "departmentId", request.getDepartmentId()
            ));

            recordHistory(request.getId(), UUID.fromString("00000000-0000-0000-0000-000000000000"),
                    "sla_warning", null, "SLA approaching deadline at " + request.getResolveBy(), now);

            warningsIssued++;
        }

        // 2. Scan for breached requests: resolve_by < now AND escalation_level < 2
        // Escalation Level 0: Technician -> Dept Head (escalation_level = 1)
        // Escalation Level 1: Dept Head -> Admin (escalation_level = 2)
        List<ServiceRequest> breachedCandidates = requestRepository.findBreachedRequests(
                now, (short) 2, PageRequest.of(0, BATCH_SIZE)
        );

        for (ServiceRequest request : breachedCandidates) {
            short oldLevel = request.getEscalationLevel();

            // Run through Chain of Responsibility
            escalationChain.escalate(request, now);
            short newLevel = request.getEscalationLevel();

            if (newLevel > oldLevel) {
                ServiceRequest saved = requestRepository.saveAndFlush(request);
                cacheService.evictAfterCommit("req:" + saved.getId());

                recordHistory(request.getId(), UUID.fromString("00000000-0000-0000-0000-000000000000"),
                        "escalation_level", String.valueOf(oldLevel), String.valueOf(newLevel), now);

                publishOutbox(request.getId(), "SlaBreached", Map.of(
                        "requestId", request.getId(),
                        "publicId", request.getPublicId(),
                        "oldLevel", oldLevel,
                        "escalationLevel", newLevel,
                        "priority", request.getPriority().name(),
                        "assigneeId", request.getAssigneeId() != null ? request.getAssigneeId() : "",
                        "departmentId", request.getDepartmentId()
                ));

                breachesEscalated++;
                log.warn("Escalated breached request {} to level {} with priority {}",
                        request.getPublicId(), newLevel, request.getPriority());
            }
        }

        int totalEvaluated = warningCandidates.size() + breachedCandidates.size();
        log.info("SLA sweep completed. Evaluated: {}, Warnings: {}, Breaches escalated: {}",
                totalEvaluated, warningsIssued, breachesEscalated);

        return new SlaSweepResult(totalEvaluated, warningsIssued, breachesEscalated);
    }

    private void recordHistory(UUID requestId, UUID actorId, String field, String oldValue, String newValue, Instant at) {
        RequestHistory history = RequestHistory.builder()
                .requestId(requestId)
                .actorId(actorId)
                .field(field)
                .oldValue(oldValue)
                .newValue(newValue)
                .at(at)
                .build();
        historyRepository.save(history);
    }

    private void publishOutbox(UUID aggregateId, String type, Object data) {
        try {
            EventEnvelope<Object> envelope = EventEnvelope.of(
                    type,
                    aggregateId,
                    UUID.randomUUID().toString(),
                    data
            );
            String json = objectMapper.writeValueAsString(envelope);
            OutboxEvent outboxEvent = OutboxEvent.builder()
                    .id(UUID.randomUUID())
                    .aggregateId(aggregateId)
                    .type(type)
                    .payload(json)
                    .createdAt(Instant.now())
                    .build();
            outboxEventRepository.save(outboxEvent);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize outbox event in SLA sweep", e);
        }
    }
}
