package com.unipulse.common.event;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.UUID;

/**
 * Standard event envelope for all UniPulse Kafka events.
 * Keying by aggregateId (e.g., requestId) guarantees partition-level ordering.
 *
 * @param <T> Payload type
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record EventEnvelope<T>(
        UUID eventId,
        String type,
        int version,
        Instant occurredAt,
        UUID aggregateId,
        String correlationId,
        T payload
) {
    public static <T> EventEnvelope<T> of(String type, UUID aggregateId, String correlationId, T payload) {
        return new EventEnvelope<>(
                UUID.randomUUID(),
                type,
                1,
                Instant.now(),
                aggregateId,
                correlationId,
                payload
        );
    }

    public static <T> EventEnvelope<T> of(String type, int version, UUID aggregateId, String correlationId, T payload) {
        return new EventEnvelope<>(
                UUID.randomUUID(),
                type,
                version,
                Instant.now(),
                aggregateId,
                correlationId,
                payload
        );
    }
}
