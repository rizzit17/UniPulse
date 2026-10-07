package com.unipulse.analytics.dto;

import java.util.List;

public record OverviewStatsResponse(
        long totalCreated,
        long totalResolved,
        long totalBreached,
        long totalWarnings,
        double slaComplianceRate,
        int avgResolveMinutes,
        long activeHotspotsCount,
        List<DailyTrendDto> dailyTrend
) {
}
