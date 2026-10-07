package com.unipulse.core.request.statemachine;

import com.unipulse.common.error.ApiException;
import com.unipulse.common.error.ErrorCodes;
import com.unipulse.common.model.RequestPriority;
import com.unipulse.common.model.RequestStatus;
import com.unipulse.core.request.domain.ServiceRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RequestStateMachineTest {

    private RequestStateMachine stateMachine;
    private ServiceRequest request;

    @BeforeEach
    void setUp() {
        stateMachine = new RequestStateMachine();
        request = ServiceRequest.builder()
                .id(UUID.randomUUID())
                .publicId("UP-2026-000001")
                .title("Test Request")
                .description("Test Description")
                .status(RequestStatus.OPEN)
                .priority(RequestPriority.P2)
                .requesterId(UUID.randomUUID())
                .departmentId(UUID.randomUUID())
                .categoryId(UUID.randomUUID())
                .locationBlock("Main Library")
                .locationRoom("101")
                .respondBy(Instant.now().plus(4, ChronoUnit.HOURS))
                .resolveBy(Instant.now().plus(24, ChronoUnit.HOURS))
                .build();
    }

    @Test
    @DisplayName("Valid transition path from OPEN through to CLOSED")
    void shouldFollowStandardLifecycle() {
        // OPEN -> ASSIGNED
        stateMachine.validateAndApplyTransition(request, RequestStatus.ASSIGNED, "Assigned to tech");
        assertThat(request.getStatus()).isEqualTo(RequestStatus.ASSIGNED);

        // ASSIGNED -> IN_PROGRESS
        stateMachine.validateAndApplyTransition(request, RequestStatus.IN_PROGRESS, "Started work");
        assertThat(request.getStatus()).isEqualTo(RequestStatus.IN_PROGRESS);

        // IN_PROGRESS -> ON_HOLD (pauses SLA)
        stateMachine.validateAndApplyTransition(request, RequestStatus.ON_HOLD, "Waiting for parts");
        assertThat(request.getStatus()).isEqualTo(RequestStatus.ON_HOLD);
        assertThat(request.getSlaPausedAt()).isNotNull();

        // ON_HOLD -> IN_PROGRESS (resumes SLA)
        stateMachine.validateAndApplyTransition(request, RequestStatus.IN_PROGRESS, "Parts received");
        assertThat(request.getStatus()).isEqualTo(RequestStatus.IN_PROGRESS);
        assertThat(request.getSlaPausedAt()).isNull();

        // IN_PROGRESS -> RESOLVED (sets resolvedAt)
        stateMachine.validateAndApplyTransition(request, RequestStatus.RESOLVED, "Issue fixed");
        assertThat(request.getStatus()).isEqualTo(RequestStatus.RESOLVED);
        assertThat(request.getResolvedAt()).isNotNull();

        // RESOLVED -> CLOSED
        stateMachine.validateAndApplyTransition(request, RequestStatus.CLOSED, "Requester confirmed");
        assertThat(request.getStatus()).isEqualTo(RequestStatus.CLOSED);
    }

    @Test
    @DisplayName("Illegal transition directly from OPEN to RESOLVED is rejected")
    void shouldRejectDirectResolutionFromOpen() {
        assertThatThrownBy(() -> stateMachine.validateAndApplyTransition(request, RequestStatus.RESOLVED, "Illegal jump"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Illegal transition from OPEN to RESOLVED")
                .extracting("code")
                .isEqualTo(ErrorCodes.ILLEGAL_TRANSITION);
    }

    @Test
    @DisplayName("Terminal state CLOSED cannot transition further")
    void shouldRejectTransitionsFromClosed() {
        request.setStatus(RequestStatus.CLOSED);
        assertThatThrownBy(() -> stateMachine.validateAndApplyTransition(request, RequestStatus.IN_PROGRESS, "Restart"))
                .isInstanceOf(ApiException.class)
                .extracting("code")
                .isEqualTo(ErrorCodes.ILLEGAL_TRANSITION);
    }

    @Test
    @DisplayName("Reopen allowed within 48-hour window")
    void shouldAllowReopenWithin48Hours() {
        request.setStatus(RequestStatus.RESOLVED);
        request.setResolvedAt(Instant.now().minus(2, ChronoUnit.HOURS));

        stateMachine.validateAndApplyTransition(request, RequestStatus.REOPENED, "Still not working");
        assertThat(request.getStatus()).isEqualTo(RequestStatus.REOPENED);
    }

    @Test
    @DisplayName("Reopen rejected after 48-hour window has expired")
    void shouldRejectReopenAfter48Hours() {
        request.setStatus(RequestStatus.RESOLVED);
        request.setResolvedAt(Instant.now().minus(49, ChronoUnit.HOURS));

        assertThatThrownBy(() -> stateMachine.validateAndApplyTransition(request, RequestStatus.REOPENED, "Reopening late"))
                .isInstanceOf(ApiException.class)
                .extracting("code")
                .isEqualTo(ErrorCodes.ILLEGAL_TRANSITION);
    }
}
