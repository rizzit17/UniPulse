package com.unipulse.common.consumer;

import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.unipulse.common.event.EventEnvelope;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.slf4j.MDC;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Shared consumer base class using the Template Method pattern.
 * Enforces at-least-once message consumption with idempotent processing (FR-MSG / System Design Section 9)
 * and dead-letter queue routing on unrecoverable errors.
 *
 * @param <T> Payload domain type
 */
@Slf4j
public abstract class AbstractEventConsumer<T> {

    protected final ObjectMapper objectMapper;
    protected final IdempotencyStore idempotencyStore;
    protected final DlqPublisher dlqPublisher;
    protected final Class<T> payloadClass;

    protected AbstractEventConsumer(
            ObjectMapper objectMapper,
            IdempotencyStore idempotencyStore,
            DlqPublisher dlqPublisher,
            Class<T> payloadClass
    ) {
        this.objectMapper = objectMapper;
        this.idempotencyStore = idempotencyStore;
        this.dlqPublisher = dlqPublisher;
        this.payloadClass = payloadClass;
    }

    public abstract String getConsumerName();

    protected abstract void process(EventEnvelope<T> envelope) throws Exception;

    public void onMessage(ConsumerRecord<String, String> record) {
        String correlationId = null;
        UUID eventId = null;

        try {
            JavaType envelopeType = objectMapper.getTypeFactory()
                    .constructParametricType(EventEnvelope.class, payloadClass);
            EventEnvelope<T> envelope = objectMapper.readValue(record.value(), envelopeType);

            eventId = envelope.eventId();
            correlationId = envelope.correlationId();
            if (correlationId != null) {
                MDC.put("correlationId", correlationId);
            }

            // 1. Idempotency Check (effectively-once execution)
            if (idempotencyStore.isProcessed(getConsumerName(), eventId)) {
                log.info("Duplicate event {} detected for consumer {}, acknowledging without reprocessing",
                        eventId, getConsumerName());
                return;
            }

            // 2. Business Logic Execution
            log.debug("Processing event {} [type={}] on topic {}", eventId, envelope.type(), record.topic());
            process(envelope);

            // 3. Mark event as processed
            idempotencyStore.markProcessed(getConsumerName(), eventId);
            log.info("Successfully processed event {} [type={}] for consumer {}",
                    eventId, envelope.type(), getConsumerName());

        } catch (Exception ex) {
            log.error("Error processing message on topic {} [key={}], routing to DLQ: {}",
                    record.topic(), record.key(), ex.getMessage(), ex);

            if (dlqPublisher != null) {
                Map<String, String> headers = new HashMap<>();
                headers.put("x-consumer", getConsumerName());
                headers.put("x-error-class", ex.getClass().getName());
                headers.put("x-error-message", ex.getMessage() != null ? ex.getMessage() : "Unknown error");
                if (correlationId != null) {
                    headers.put("x-correlation-id", correlationId);
                }
                dlqPublisher.sendToDlq(record.topic(), record.key(), record.value(), ex, headers);
            } else {
                throw new RuntimeException("Consumer processing failed and no DLQ publisher configured", ex);
            }
        } finally {
            MDC.remove("correlationId");
        }
    }
}
