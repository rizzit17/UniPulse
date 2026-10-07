package com.unipulse.analytics.dto;

import java.util.List;

public record SlaMetricsResponse(
        long totalEvaluated,
        long totalBreached,
        long totalWarnings,
        double complianceRate,
        List<DepartmentSlaDto> departmentBreakdown
) {
}
