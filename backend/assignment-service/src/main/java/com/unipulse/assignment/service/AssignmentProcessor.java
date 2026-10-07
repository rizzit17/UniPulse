package com.unipulse.assignment.service;

import com.unipulse.assignment.domain.TechnicianCandidateEntity;
import com.unipulse.assignment.dto.RequestCreatedPayload;
import com.unipulse.assignment.repo.AssignmentRequestRepository;
import com.unipulse.assignment.repo.TechnicianCandidateRepository;
import com.unipulse.assignment.strategy.AssignmentStrategy;
import com.unipulse.assignment.strategy.AssignmentStrategyFactory;
import com.unipulse.assignment.strategy.TechnicianCandidate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AssignmentProcessor {

    private final TechnicianCandidateRepository candidateRepository;
    private final AssignmentRequestRepository requestRepository;
    private final AssignmentStrategyFactory strategyFactory;
    private final RedisWorkloadTracker workloadTracker;
    private final AssignmentEventPublisher eventPublisher;

    @Transactional
    public boolean assignRequest(RequestCreatedPayload payload, String correlationId) {
        UUID requestId = payload.requestId();
        UUID departmentId = payload.departmentId();

        log.info("Evaluating technician assignment for request {} (Dept: {})", requestId, departmentId);

        // 1. Fetch technician profiles for this department
        List<TechnicianCandidateEntity> entities = candidateRepository.findActiveTechniciansInDepartment(departmentId);
        if (entities.isEmpty()) {
            log.warn("No active technicians registered in department {} for request {}", departmentId, requestId);
            return false;
        }

        // 2. Build candidate models populated with Redis workload
        List<TechnicianCandidate> candidates = entities.stream()
                .map(e -> {
                    double currentLoad = workloadTracker.getWorkload(departmentId, e.getUserId());
                    return new TechnicianCandidate(
                            e.getUserId(),
                            departmentId,
                            e.getSkills(),
                            e.getShiftStart(),
                            e.getShiftEnd(),
                            e.getMaxActive(),
                            currentLoad
                    );
                })
                .toList();

        // 3. Select best candidate using active strategy
        AssignmentStrategy strategy = strategyFactory.getActiveStrategy();
        Optional<TechnicianCandidate> selected = strategy.selectAssignee(payload, candidates);

        if (selected.isEmpty()) {
            log.warn("Strategy '{}' could not select an eligible technician for request {}", strategy.getName(), requestId);
            return false;
        }

        TechnicianCandidate technician = selected.get();
        log.info("Strategy '{}' selected technician {} for request {}",
                strategy.getName(), technician.userId(), requestId);

        // 4. Atomic conditional DB update guard (SYSTEM_DESIGN.md section 5)
        Instant now = Instant.now();
        int rowsUpdated = requestRepository.assignTechnician(requestId, technician.userId(), now);

        if (rowsUpdated == 1) {
            // Update Redis workload
            workloadTracker.incrementWorkload(departmentId, technician.userId(), payload.priority());

            // Emit RequestAssigned domain event
            eventPublisher.publishRequestAssigned(requestId, payload.publicId(), technician.userId(), correlationId);

            log.info("Successfully assigned request {} to technician {}", requestId, technician.userId());
            return true;
        } else {
            log.info("Request {} was already assigned or status was not OPEN; skipped assignment update without error.", requestId);
            return false;
        }
    }
}
