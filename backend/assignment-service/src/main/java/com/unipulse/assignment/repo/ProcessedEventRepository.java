package com.unipulse.assignment.repo;

import com.unipulse.assignment.domain.ProcessedEvent;
import com.unipulse.assignment.domain.ProcessedEventId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ProcessedEventRepository extends JpaRepository<ProcessedEvent, ProcessedEventId> {
    boolean existsByConsumerAndEventId(String consumer, UUID eventId);
}
