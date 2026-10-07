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
@Table(name = "technician_stats", schema = "analytics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TechnicianStats {

    @EmbeddedId
    private TechnicianStatsId id;

    @Column(name = "assigned_count", nullable = false)
    @Builder.Default
    private int assignedCount = 0;

    @Column(name = "resolved_count", nullable = false)
    @Builder.Default
    private int resolvedCount = 0;

    @Column(name = "total_resolve_seconds", nullable = false)
    @Builder.Default
    private long totalResolveSeconds = 0;

    @Column(name = "avg_resolve_seconds", nullable = false)
    @Builder.Default
    private int avgResolveSeconds = 0;
}
