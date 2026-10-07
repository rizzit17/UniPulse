package com.unipulse.analytics.dto;

import java.util.UUID;

public record DepartmentSlaDto(
        UUID departmentId,
        long created,
        long resolved,
        long breached,
        double complianceRate
) {
}
