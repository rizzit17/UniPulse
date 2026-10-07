package com.unipulse.notification.domain;

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
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Document(collection = "notifications")
@CompoundIndex(name = "uniq_event_user_channel", def = "{'eventId': 1, 'userId': 1, 'channel': 1}", unique = true)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDocument {

    @Id
    private String id;

    @Indexed
    private UUID eventId;

    @Indexed
    private UUID userId;

    private String userEmail;

    @Indexed
    private UUID requestId;

    private String publicId;

    private String title;

    private String message;

    private String channel; // IN_APP, EMAIL

    private String status; // DELIVERED, FAILED

    @Builder.Default
    private Map<String, Object> metadata = new HashMap<>();

    @Builder.Default
    private Instant createdAt = Instant.now();

    private Instant deliveredAt;
}
