package com.unipulse.assignment.service;

import com.unipulse.assignment.domain.TechnicianCandidateEntity;
import com.unipulse.assignment.dto.RequestCreatedPayload;
import com.unipulse.assignment.repo.AssignmentRequestRepository;
import com.unipulse.assignment.repo.TechnicianCandidateRepository;
import com.unipulse.assignment.strategy.AssignmentStrategy;
import com.unipulse.assignment.strategy.AssignmentStrategyFactory;
import com.unipulse.assignment.strategy.TechnicianCandidate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AssignmentProcessorTest {

    @Mock
    private TechnicianCandidateRepository candidateRepository;

    @Mock
    private AssignmentRequestRepository requestRepository;

    @Mock
    private AssignmentStrategyFactory strategyFactory;

    @Mock
    private RedisWorkloadTracker workloadTracker;

    @Mock
    private AssignmentEventPublisher eventPublisher;

    @Mock
    private AssignmentStrategy mockStrategy;

    @InjectMocks
    private AssignmentProcessor assignmentProcessor;

    private final UUID deptId = UUID.randomUUID();
    private final UUID requestId = UUID.randomUUID();
    private final UUID techId = UUID.randomUUID();
    private RequestCreatedPayload payload;

    @BeforeEach
    void setUp() {
        payload = new RequestCreatedPayload(
                requestId,
                "UP-2026-000001",
                UUID.randomUUID(),
                deptId,
                UUID.randomUUID(),
                "P1",
                "Science Block"
        );
    }

    @Test
    @DisplayName("Successfully assigns technician when candidate is eligible and update succeeds")
    void shouldSuccessfullyAssignTechnician() {
        TechnicianCandidateEntity entity = new TechnicianCandidateEntity();
        entity.setUserId(techId);
        entity.setSkills(List.of("HVAC"));
        entity.setShiftStart(LocalTime.of(0, 0));
        entity.setShiftEnd(LocalTime.of(23, 59));
        entity.setMaxActive(5);

        when(candidateRepository.findActiveTechniciansInDepartment(deptId)).thenReturn(List.of(entity));
        when(workloadTracker.getWorkload(deptId, techId)).thenReturn(2.0);
        when(strategyFactory.getActiveStrategy()).thenReturn(mockStrategy);
        when(mockStrategy.getName()).thenReturn("least-loaded");

        TechnicianCandidate selected = new TechnicianCandidate(
                techId, deptId, List.of("HVAC"), LocalTime.of(0, 0), LocalTime.of(23, 59), 5, 2.0
        );
        when(mockStrategy.selectAssignee(eq(payload), anyList())).thenReturn(Optional.of(selected));

        when(requestRepository.assignTechnician(eq(requestId), eq(techId), any(Instant.class))).thenReturn(1);

        boolean assigned = assignmentProcessor.assignRequest(payload, "corr-123");

        assertThat(assigned).isTrue();
        verify(workloadTracker).incrementWorkload(deptId, techId, "P1");
        verify(eventPublisher).publishRequestAssigned(requestId, "UP-2026-000001", techId, "corr-123");
    }

    @Test
    @DisplayName("Handles race condition gracefully when another worker already assigned the request")
    void shouldHandleRaceConditionWhenRowNotUpdated() {
        TechnicianCandidateEntity entity = new TechnicianCandidateEntity();
        entity.setUserId(techId);
        entity.setShiftStart(LocalTime.of(0, 0));
        entity.setShiftEnd(LocalTime.of(23, 59));
        entity.setMaxActive(5);

        when(candidateRepository.findActiveTechniciansInDepartment(deptId)).thenReturn(List.of(entity));
        when(strategyFactory.getActiveStrategy()).thenReturn(mockStrategy);
        when(mockStrategy.getName()).thenReturn("least-loaded");

        TechnicianCandidate selected = new TechnicianCandidate(
                techId, deptId, List.of(), LocalTime.of(0, 0), LocalTime.of(23, 59), 5, 1.0
        );
        when(mockStrategy.selectAssignee(eq(payload), anyList())).thenReturn(Optional.of(selected));

        // Atomic update returns 0 because another worker won the race
        when(requestRepository.assignTechnician(eq(requestId), eq(techId), any(Instant.class))).thenReturn(0);

        boolean assigned = assignmentProcessor.assignRequest(payload, "corr-123");

        assertThat(assigned).isFalse();
        verify(workloadTracker, never()).incrementWorkload(any(), any(), any());
        verify(eventPublisher, never()).publishRequestAssigned(any(), any(), any(), any());
    }

    @Test
    @DisplayName("Returns false when no active technicians exist in the department")
    void shouldReturnFalseWhenNoTechniciansInDepartment() {
        when(candidateRepository.findActiveTechniciansInDepartment(deptId)).thenReturn(List.of());

        boolean assigned = assignmentProcessor.assignRequest(payload, "corr-123");

        assertThat(assigned).isFalse();
        verify(requestRepository, never()).assignTechnician(any(), any(), any());
    }
}
