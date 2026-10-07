package com.unipulse.analytics.consumer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.unipulse.analytics.service.AnalyticsAggregationService;
import com.unipulse.analytics.service.AnalyticsIdempotencyStore;
import com.unipulse.analytics.service.KafkaDlqPublisher;
import com.unipulse.common.consumer.AbstractEventConsumer;
import com.unipulse.common.event.EventEnvelope;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class AnalyticsEventConsumer extends AbstractEventConsumer<JsonNode> {

    public static final String CONSUMER_NAME = "analytics-service-events";

    private final AnalyticsAggregationService aggregationService;

    public AnalyticsEventConsumer(
            ObjectMapper objectMapper,
            AnalyticsIdempotencyStore idempotencyStore,
            KafkaDlqPublisher dlqPublisher,
            AnalyticsAggregationService aggregationService
    ) {
        super(objectMapper, idempotencyStore, dlqPublisher, JsonNode.class);
        this.aggregationService = aggregationService;
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
            groupId = "unipulse-analytics-group"
    )
    public void listen(ConsumerRecord<String, String> record) {
        onMessage(record);
    }

    @Override
    protected void process(EventEnvelope<JsonNode> envelope) throws Exception {
        log.info("Processing analytics event {} of type {}", envelope.eventId(), envelope.type());
        aggregationService.processEvent(envelope);
    }
}
