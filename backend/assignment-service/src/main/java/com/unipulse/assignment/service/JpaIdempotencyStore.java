package com.unipulse.assignment.service;

import com.unipulse.assignment.domain.ProcessedEvent;
import com.unipulse.assignment.repo.ProcessedEventRepository;
import com.unipulse.common.consumer.IdempotencyStore;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class JpaIdempotencyStore implements IdempotencyStore {

    private final ProcessedEventRepository repository;

    @Override
    @Transactional(readOnly = true)
    public boolean isProcessed(String consumerName, UUID eventId) {
        return repository.existsByConsumerAndEventId(consumerName, eventId);
    }

    @Override
    @Transactional
    public void markProcessed(String consumerName, UUID eventId) {
        repository.save(ProcessedEvent.builder()
                .consumer(consumerName)
                .eventId(eventId)
                .processedAt(Instant.now())
                .build());
    }
}
