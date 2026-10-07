package com.unipulse.analytics.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record ActivityFeedDto(
        String id,
        UUID requestId,
        String publicId,
        String eventType,
        UUID actorId,
        String actorName,
        String actorRole,
        String summary,
        Map<String, Object> details,
        Instant timestamp
) {
}
