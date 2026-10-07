package com.unipulse.common;

import com.unipulse.common.error.ApiError;
import com.unipulse.common.error.ApiException;
import com.unipulse.common.error.ErrorCodes;
import com.unipulse.common.event.EventEnvelope;
import com.unipulse.common.model.RequestPriority;
import com.unipulse.common.model.RequestStatus;
import com.unipulse.common.model.UserRole;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.net.URI;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class CommonModuleTest {

    @Test
    @DisplayName("EventEnvelope should initialize with valid metadata and random eventId")
    void eventEnvelopeShouldInitializeCorrectly() {
        UUID aggregateId = UUID.randomUUID();
        String correlationId = UUID.randomUUID().toString();
        String payload = "test-payload";

        EventEnvelope<String> envelope = EventEnvelope.of("request.created.v1", aggregateId, correlationId, payload);

        assertThat(envelope.eventId()).isNotNull();
        assertThat(envelope.type()).isEqualTo("request.created.v1");
        assertThat(envelope.version()).isEqualTo(1);
        assertThat(envelope.occurredAt()).isNotNull();
        assertThat(envelope.aggregateId()).isEqualTo(aggregateId);
        assertThat(envelope.correlationId()).isEqualTo(correlationId);
        assertThat(envelope.payload()).isEqualTo("test-payload");
    }

    @Test
    @DisplayName("ApiError and ApiException should construct valid RFC 7807 responses")
    void apiErrorAndExceptionShouldConstructCorrectly() {
        ApiException ex = ApiException.conflict(ErrorCodes.STALE_VERSION, "Resource modified concurrently");
        assertThat(ex.getStatus()).isEqualTo(409);
        assertThat(ex.getCode()).isEqualTo(ErrorCodes.STALE_VERSION);
        assertThat(ex.getMessage()).isEqualTo("Resource modified concurrently");

        ApiError error = ApiError.of(409, "Conflict", ex.getMessage(), ex.getCode(), URI.create("/api/v1/requests/123"));
        assertThat(error.status()).isEqualTo(409);
        assertThat(error.code()).isEqualTo("STALE_VERSION");
        assertThat(error.detail()).contains("concurrently");
        assertThat(error.timestamp()).isNotNull();
    }

    @Test
    @DisplayName("RequestPriority should maintain configured weights and response intervals")
    void requestPriorityShouldHaveProperWeights() {
        assertThat(RequestPriority.P1.getWeight()).isEqualTo(5);
        assertThat(RequestPriority.P2.getWeight()).isEqualTo(3);
        assertThat(RequestPriority.P3.getWeight()).isEqualTo(2);
        assertThat(RequestPriority.P4.getWeight()).isEqualTo(1);
    }

    @Test
    @DisplayName("RequestStatus should identify active and terminal states")
    void requestStatusShouldIdentifyActiveAndTerminal() {
        assertThat(RequestStatus.OPEN.isActive()).isTrue();
        assertThat(RequestStatus.ASSIGNED.isActive()).isTrue();
        assertThat(RequestStatus.CLOSED.isTerminal()).isTrue();
        assertThat(RequestStatus.CANCELLED.isTerminal()).isTrue();
        assertThat(RequestStatus.CLOSED.isActive()).isFalse();
    }

    @Test
    @DisplayName("UserRole should convert to Spring Security authority")
    void userRoleShouldConvertToAuthority() {
        assertThat(UserRole.ADMIN.asAuthority()).isEqualTo("ROLE_ADMIN");
        assertThat(UserRole.TECHNICIAN.asAuthority()).isEqualTo("ROLE_TECHNICIAN");
    }
}
