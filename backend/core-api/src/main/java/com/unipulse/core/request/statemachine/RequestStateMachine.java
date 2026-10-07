package com.unipulse.core.request.statemachine;

import com.unipulse.common.error.ApiException;
import com.unipulse.common.error.ErrorCodes;
import com.unipulse.common.model.RequestStatus;
import com.unipulse.core.request.domain.ServiceRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Set;

@Slf4j
@Component
public class RequestStateMachine {

    private static final Map<RequestStatus, Set<RequestStatus>> ALLOWED_TRANSITIONS = Map.of(
            RequestStatus.OPEN, Set.of(RequestStatus.ASSIGNED, RequestStatus.CANCELLED),
            RequestStatus.ASSIGNED, Set.of(RequestStatus.IN_PROGRESS, RequestStatus.CANCELLED),
            RequestStatus.IN_PROGRESS, Set.of(RequestStatus.ON_HOLD, RequestStatus.RESOLVED),
            RequestStatus.ON_HOLD, Set.of(RequestStatus.IN_PROGRESS),
            RequestStatus.RESOLVED, Set.of(RequestStatus.CLOSED, RequestStatus.REOPENED),
            RequestStatus.REOPENED, Set.of(RequestStatus.ASSIGNED, RequestStatus.IN_PROGRESS),
            RequestStatus.CLOSED, Set.of(),
            RequestStatus.CANCELLED, Set.of()
    );

    private static final long REOPEN_WINDOW_HOURS = 48L;

    public void validateAndApplyTransition(ServiceRequest request, RequestStatus targetStatus, String reason) {
        RequestStatus currentStatus = request.getStatus();

        if (currentStatus == targetStatus) {
            return;
        }

        Set<RequestStatus> allowed = ALLOWED_TRANSITIONS.getOrDefault(currentStatus, Set.of());
        if (!allowed.contains(targetStatus)) {
            throw new ApiException(
                    409,
                    ErrorCodes.ILLEGAL_TRANSITION,
                    "Illegal transition from " + currentStatus + " to " + targetStatus + "."
            );
        }

        Instant now = Instant.now();

        // Specific transition logic
        if (targetStatus == RequestStatus.ON_HOLD) {
            // SLA clock pause (FR-REQ-3)
            request.setSlaPausedAt(now);
            log.info("Request {} transitioned to ON_HOLD. SLA paused at {}", request.getPublicId(), now);
        } else if (currentStatus == RequestStatus.ON_HOLD && targetStatus == RequestStatus.IN_PROGRESS) {
            // SLA clock resume: calculate pause duration and push resolveBy forward
            if (request.getSlaPausedAt() != null) {
                long pausedSeconds = Duration.between(request.getSlaPausedAt(), now).toSeconds();
                if (pausedSeconds > 0) {
                    request.setSlaPausedTotalSeconds(request.getSlaPausedTotalSeconds() + (int) pausedSeconds);
                    request.setResolveBy(request.getResolveBy().plusSeconds(pausedSeconds));
                    log.info("Request {} resumed from ON_HOLD. SLA paused for {}s, extended resolveBy to {}",
                            request.getPublicId(), pausedSeconds, request.getResolveBy());
                }
                request.setSlaPausedAt(null);
            }
        } else if (targetStatus == RequestStatus.RESOLVED) {
            request.setResolvedAt(now);
            log.info("Request {} transitioned to RESOLVED at {}", request.getPublicId(), now);
        } else if (targetStatus == RequestStatus.REOPENED) {
            // Reopening window check (FR-REQ-3: maximum 48 hours)
            if (request.getResolvedAt() != null) {
                long hoursSinceResolved = Duration.between(request.getResolvedAt(), now).toHours();
                if (hoursSinceResolved >= REOPEN_WINDOW_HOURS) {
                    throw new ApiException(
                            409,
                            ErrorCodes.ILLEGAL_TRANSITION,
                            "Cannot reopen request " + request.getPublicId() + " after " + REOPEN_WINDOW_HOURS
                                    + " hours of resolution. Please submit a new request."
                    );
                }
            }
            request.setResolvedAt(null);
            log.info("Request {} transitioned to REOPENED within allowed window", request.getPublicId());
        }

        request.setStatus(targetStatus);
        request.setUpdatedAt(now);
    }
}
