package com.unipulse.analytics.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Document(collection = "activity_feed")
@CompoundIndex(name = "idx_activity_req_time", def = "{'requestId': 1, 'timestamp': -1}")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityFeedEntry {

    @Id
    private String id;

    @Indexed
    private UUID requestId;

    private String publicId;

    private String eventType;

    private UUID actorId;

    private String actorName;

    private String actorRole;

    private String summary;

    private Map<String, Object> details;

    @Builder.Default
    private Instant timestamp = Instant.now();
}
