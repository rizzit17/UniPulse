package com.unipulse.analytics.dto;

import java.time.Instant;
import java.util.UUID;

public record HotspotDto(
        String locationBlock,
        String locationRoom,
        UUID categoryId,
        int count30d,
        Instant lastReportedAt
) {
}
