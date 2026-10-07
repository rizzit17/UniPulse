package com.unipulse.analytics.dto;

import java.time.LocalDate;

public record DailyTrendDto(
        LocalDate date,
        int created,
        int resolved,
        int breached
) {
}
