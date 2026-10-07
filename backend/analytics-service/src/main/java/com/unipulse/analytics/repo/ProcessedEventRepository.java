package com.unipulse.analytics.repo;

import com.unipulse.analytics.model.ProcessedEvent;
import com.unipulse.analytics.model.ProcessedEventId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProcessedEventRepository extends JpaRepository<ProcessedEvent, ProcessedEventId> {
}
