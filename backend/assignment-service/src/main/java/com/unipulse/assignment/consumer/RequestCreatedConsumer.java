package com.unipulse.assignment.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.unipulse.assignment.dto.RequestCreatedPayload;
import com.unipulse.assignment.service.AssignmentProcessor;
import com.unipulse.assignment.service.JpaIdempotencyStore;
import com.unipulse.assignment.service.KafkaDlqPublisher;
import com.unipulse.common.consumer.AbstractEventConsumer;
import com.unipulse.common.event.EventEnvelope;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class RequestCreatedConsumer extends AbstractEventConsumer<RequestCreatedPayload> {

    public static final String CONSUMER_NAME = "assignment-service-request-created";

    private final AssignmentProcessor assignmentProcessor;

    public RequestCreatedConsumer(
            ObjectMapper objectMapper,
            JpaIdempotencyStore idempotencyStore,
            KafkaDlqPublisher dlqPublisher,
            AssignmentProcessor assignmentProcessor
    ) {
        super(objectMapper, idempotencyStore, dlqPublisher, RequestCreatedPayload.class);
        this.assignmentProcessor = assignmentProcessor;
    }

    @Override
    public String getConsumerName() {
        return CONSUMER_NAME;
    }

    @KafkaListener(topics = "request.created.v1", groupId = "unipulse-assignment-group")
    public void listen(ConsumerRecord<String, String> record) {
        onMessage(record);
    }

    @Override
    protected void process(EventEnvelope<RequestCreatedPayload> envelope) throws Exception {
        RequestCreatedPayload payload = envelope.payload();
        if (payload == null || payload.requestId() == null) {
            log.warn("Received RequestCreated event with empty payload or requestId: {}", envelope);
            return;
        }

        assignmentProcessor.assignRequest(payload, envelope.correlationId());
    }
}
