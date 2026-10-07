package com.unipulse.notification.service;

import com.unipulse.common.consumer.IdempotencyStore;
import com.unipulse.notification.domain.MongoProcessedEvent;
import com.unipulse.notification.repo.MongoProcessedEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MongoIdempotencyStore implements IdempotencyStore {

    private final MongoProcessedEventRepository repository;

    @Override
    public boolean isProcessed(String consumer, UUID eventId) {
        return repository.existsByConsumerAndEventId(consumer, eventId);
    }

    @Override
    public void markProcessed(String consumer, UUID eventId) {
        try {
            MongoProcessedEvent event = MongoProcessedEvent.builder()
                    .consumer(consumer)
                    .eventId(eventId)
                    .processedAt(Instant.now())
                    .build();
            repository.save(event);
        } catch (DuplicateKeyException e) {
            log.debug("Event {} already marked processed for consumer {}", eventId, consumer);
        }
    }
}
