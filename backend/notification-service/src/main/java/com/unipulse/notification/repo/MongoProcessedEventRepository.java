package com.unipulse.notification.repo;

import com.unipulse.notification.domain.MongoProcessedEvent;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface MongoProcessedEventRepository extends MongoRepository<MongoProcessedEvent, String> {

    boolean existsByConsumerAndEventId(String consumer, UUID eventId);
}
