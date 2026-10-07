package com.unipulse.core.request.sla;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.unipulse.common.model.RequestPriority;
import com.unipulse.common.model.RequestStatus;
import com.unipulse.core.request.domain.ServiceRequest;
import com.unipulse.core.request.repo.OutboxEventRepository;
import com.unipulse.core.request.repo.RequestHistoryRepository;
import com.unipulse.core.request.repo.ServiceRequestRepository;
import com.unipulse.core.shared.cache.RedisCacheService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SlaSweepServiceTest {

    @Mock
    private ServiceRequestRepository requestRepository;

    @Mock
    private RequestHistoryRepository historyRepository;

    @Mock
    private OutboxEventRepository outboxEventRepository;

    @Mock
    private RedisCacheService cacheService;

    private EscalationChain escalationChain;
    private SlaSweepService slaSweepService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
        objectMapper.disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        TechnicianToDeptHeadEscalationHandler techHandler = new TechnicianToDeptHeadEscalationHandler();
        DeptHeadToAdminEscalationHandler adminHandler = new DeptHeadToAdminEscalationHandler();
        escalationChain = new EscalationChain(techHandler, adminHandler);
        escalationChain.initChain();

        slaSweepService = new SlaSweepService(
                requestRepository,
                historyRepository,
                outboxEventRepository,
                escalationChain,
                cacheService,
                objectMapper
        );
    }

    @Test
    @DisplayName("Escalates breached request from Level 0 to Level 1 and bumps priority")
    void shouldEscalateBreachedRequest() {
        UUID reqId = UUID.randomUUID();
        Instant past = Instant.now().minus(2, ChronoUnit.HOURS);

        ServiceRequest request = ServiceRequest.builder()
                .id(reqId)
                .publicId("UP-2026-000001")
                .status(RequestStatus.OPEN)
                .priority(RequestPriority.P3)
                .resolveBy(past)
                .escalationLevel((short) 0)
                .departmentId(UUID.randomUUID())
                .build();

        when(requestRepository.findWarningRequests(any(), any(), any(Pageable.class))).thenReturn(List.of());
        when(requestRepository.findBreachedRequests(any(), eq((short) 2), any(Pageable.class)))
                .thenReturn(List.of(request));
        when(requestRepository.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));

        SlaSweepResult result = slaSweepService.sweep();

        assertThat(result.breachesEscalated()).isEqualTo(1);
        assertThat(request.getEscalationLevel()).isEqualTo((short) 1);
        assertThat(request.getPriority()).isEqualTo(RequestPriority.P2); // P3 bumped to P2

        verify(outboxEventRepository).save(any());
        verify(historyRepository).save(any());
        verify(cacheService).evictAfterCommit("req:" + reqId);
    }

    @Test
    @DisplayName("Running sweep twice consecutively does not double-escalate (idempotent)")
    void shouldBeIdempotentOnConsecutiveRuns() {
        Instant past = Instant.now().minus(2, ChronoUnit.HOURS);

        // A request that is already at Level 1
        ServiceRequest request = ServiceRequest.builder()
                .id(UUID.randomUUID())
                .publicId("UP-2026-000002")
                .status(RequestStatus.IN_PROGRESS)
                .priority(RequestPriority.P2)
                .resolveBy(past)
                .escalationLevel((short) 1)
                .departmentId(UUID.randomUUID())
                .build();

        when(requestRepository.findWarningRequests(any(), any(), any(Pageable.class))).thenReturn(List.of());

        // First run: Level 1 escalates to Level 2
        when(requestRepository.findBreachedRequests(any(), eq((short) 2), any(Pageable.class)))
                .thenReturn(List.of(request));
        when(requestRepository.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));

        SlaSweepResult firstRun = slaSweepService.sweep();
        assertThat(firstRun.breachesEscalated()).isEqualTo(1);
        assertThat(request.getEscalationLevel()).isEqualTo((short) 2);

        // Second run: request is now at maxLevel 2 -> query returns empty (no further escalation)
        when(requestRepository.findBreachedRequests(any(), eq((short) 2), any(Pageable.class)))
                .thenReturn(List.of());

        SlaSweepResult secondRun = slaSweepService.sweep();
        assertThat(secondRun.breachesEscalated()).isEqualTo(0);
    }

    @Test
    @DisplayName("Issues warning for requests approaching resolution deadline")
    void shouldIssueWarningForNearDeadlineRequests() {
        ServiceRequest request = ServiceRequest.builder()
                .id(UUID.randomUUID())
                .publicId("UP-2026-000003")
                .status(RequestStatus.OPEN)
                .priority(RequestPriority.P2)
                .resolveBy(Instant.now().plus(30, ChronoUnit.MINUTES))
                .escalationLevel((short) 0)
                .departmentId(UUID.randomUUID())
                .build();

        when(requestRepository.findWarningRequests(any(), any(), any(Pageable.class)))
                .thenReturn(List.of(request));
        when(requestRepository.findBreachedRequests(any(), eq((short) 2), any(Pageable.class)))
                .thenReturn(List.of());

        SlaSweepResult result = slaSweepService.sweep();

        assertThat(result.warningsIssued()).isEqualTo(1);
        assertThat(result.breachesEscalated()).isEqualTo(0);
        verify(outboxEventRepository).save(any());
    }
}
