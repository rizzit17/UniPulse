package com.unipulse.notification.consumer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.unipulse.common.consumer.AbstractEventConsumer;
import com.unipulse.common.event.EventEnvelope;
import com.unipulse.notification.service.KafkaDlqPublisher;
import com.unipulse.notification.service.MongoIdempotencyStore;
import com.unipulse.notification.service.NotificationEventDispatcher;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class NotificationEventConsumer extends AbstractEventConsumer<JsonNode> {

    public static final String CONSUMER_NAME = "notification-service-events";

    private final NotificationEventDispatcher dispatcher;

    public NotificationEventConsumer(
            ObjectMapper objectMapper,
            MongoIdempotencyStore idempotencyStore,
            KafkaDlqPublisher dlqPublisher,
            NotificationEventDispatcher dispatcher
    ) {
        super(objectMapper, idempotencyStore, dlqPublisher, JsonNode.class);
        this.dispatcher = dispatcher;
    }

    @Override
    public String getConsumerName() {
        return CONSUMER_NAME;
    }

    @KafkaListener(
            topics = {
                    "request.created.v1",
                    "request.assigned.v1",
                    "request.status-changed.v1",
                    "request.comment-added.v1",
                    "sla.warning.v1",
                    "sla.breached.v1"
            },
            groupId = "unipulse-notification-group"
    )
    public void listen(ConsumerRecord<String, String> record) {
        onMessage(record);
    }

    @Override
    protected void process(EventEnvelope<JsonNode> envelope) throws Exception {
        log.info("Processing notification event {} of type {}", envelope.eventId(), envelope.type());
        int dispatchedCount = dispatcher.dispatch(envelope);
        log.info("Dispatched {} notifications for event {}", dispatchedCount, envelope.eventId());
    }
}
