package com.unipulse.analytics.dto;

import java.util.UUID;

public record TechnicianWorkloadDto(
        UUID technicianId,
        int assignedCount,
        int resolvedCount,
        int avgResolveSeconds,
        double avgResolveMinutes
) {
}
