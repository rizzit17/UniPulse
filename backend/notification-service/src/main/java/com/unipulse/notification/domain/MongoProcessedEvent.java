package com.unipulse.notification.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.UUID;

@Document(collection = "processed_events")
@CompoundIndex(name = "uniq_consumer_event", def = "{'consumer': 1, 'eventId': 1}", unique = true)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MongoProcessedEvent {

    @Id
    private String id;

    private String consumer;

    private UUID eventId;

    @Builder.Default
    private Instant processedAt = Instant.now();
}
