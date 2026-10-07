package com.unipulse.analytics.service;

import com.unipulse.analytics.model.ProcessedEvent;
import com.unipulse.analytics.model.ProcessedEventId;
import com.unipulse.analytics.repo.ProcessedEventRepository;
import com.unipulse.common.consumer.IdempotencyStore;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AnalyticsIdempotencyStore implements IdempotencyStore {

    private final ProcessedEventRepository repository;

    @Override
    @Transactional(readOnly = true)
    public boolean isProcessed(String consumerName, UUID eventId) {
        return repository.existsById(new ProcessedEventId(consumerName, eventId));
    }

    @Override
    @Transactional
    public void markProcessed(String consumerName, UUID eventId) {
        repository.save(ProcessedEvent.builder()
                .id(new ProcessedEventId(consumerName, eventId))
                .processedAt(Instant.now())
                .build());
    }
}
