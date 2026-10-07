package com.unipulse.notification.service;

import com.unipulse.common.consumer.DlqPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.header.internals.RecordHeader;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class KafkaDlqPublisher implements DlqPublisher {

    private final KafkaTemplate<String, String> kafkaTemplate;

    @Override
    public void sendToDlq(String originalTopic, String key, String payload, Exception cause, Map<String, String> headers) {
        String dlqTopic = originalTopic + ".dlq";
        log.warn("Publishing notification poison message to DLQ {} [key={}], cause: {}", dlqTopic, key, cause.getMessage());

        ProducerRecord<String, String> record = new ProducerRecord<>(dlqTopic, key, payload);
        if (headers != null) {
            headers.forEach((hKey, hVal) -> {
                if (hVal != null) {
                    record.headers().add(new RecordHeader(hKey, hVal.getBytes(StandardCharsets.UTF_8)));
                }
            });
        }

        try {
            kafkaTemplate.send(record);
            log.info("Poison message routed to DLQ topic {}", dlqTopic);
        } catch (Exception e) {
            log.error("Failed to publish poison message to DLQ {}: {}", dlqTopic, e.getMessage(), e);
        }
    }
}
