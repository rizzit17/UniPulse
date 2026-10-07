package com.unipulse.analytics.repo;

import com.unipulse.analytics.model.ActivityFeedEntry;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ActivityFeedRepository extends MongoRepository<ActivityFeedEntry, String> {

    List<ActivityFeedEntry> findByRequestIdOrderByTimestampDesc(UUID requestId);

    void deleteByRequestId(UUID requestId);
}
