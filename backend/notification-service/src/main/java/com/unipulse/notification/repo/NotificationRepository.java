package com.unipulse.notification.repo;

import com.unipulse.notification.domain.NotificationDocument;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends MongoRepository<NotificationDocument, String> {

    List<NotificationDocument> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    boolean existsByEventIdAndUserIdAndChannel(UUID eventId, UUID userId, String channel);
}
