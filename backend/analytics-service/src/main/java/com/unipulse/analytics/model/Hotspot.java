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

import java.time.Instant;

@Entity
@Table(name = "hotspots", schema = "analytics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Hotspot {

    @EmbeddedId
    private HotspotId id;

    @Column(name = "count_30d", nullable = false)
    @Builder.Default
    private int count30d = 0;

    @Column(name = "last_reported_at", nullable = false)
    @Builder.Default
    private Instant lastReportedAt = Instant.now();
}
