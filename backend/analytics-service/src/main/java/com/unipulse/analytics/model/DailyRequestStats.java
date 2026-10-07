package com.unipulse.analytics.model;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "daily_request_stats", schema = "analytics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyRequestStats {

    @EmbeddedId
    private DailyRequestStatsId id;

    @Column(name = "created_count", nullable = false)
    @Builder.Default
    private int createdCount = 0;

    @Column(name = "resolved_count", nullable = false)
    @Builder.Default
    private int resolvedCount = 0;

    @Column(name = "breached_count", nullable = false)
    @Builder.Default
    private int breachedCount = 0;

    @Column(name = "sla_warning_count", nullable = false)
    @Builder.Default
    private int slaWarningCount = 0;
}
