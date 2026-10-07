package com.unipulse.analytics.api;

import com.unipulse.analytics.dto.*;
import com.unipulse.analytics.service.AnalyticsAggregationService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsAggregationService aggregationService;

    @GetMapping("/overview")
    @PreAuthorize("hasAnyRole('DEPARTMENT_HEAD', 'ADMIN')")
    public ResponseEntity<OverviewStatsResponse> getOverview(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) UUID departmentId
    ) {
        return ResponseEntity.ok(aggregationService.getOverview(startDate, endDate, departmentId));
    }

    @GetMapping("/sla")
    @PreAuthorize("hasAnyRole('DEPARTMENT_HEAD', 'ADMIN')")
    public ResponseEntity<SlaMetricsResponse> getSla(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) UUID departmentId
    ) {
        return ResponseEntity.ok(aggregationService.getSlaMetrics(startDate, endDate, departmentId));
    }

    @GetMapping("/hotspots")
    @PreAuthorize("hasAnyRole('DEPARTMENT_HEAD', 'ADMIN')")
    public ResponseEntity<List<HotspotDto>> getHotspots(
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ResponseEntity.ok(aggregationService.getTopHotspots(limit));
    }

    @GetMapping("/workload")
    @PreAuthorize("hasAnyRole('DEPARTMENT_HEAD', 'ADMIN')")
    public ResponseEntity<List<TechnicianWorkloadDto>> getWorkload(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return ResponseEntity.ok(aggregationService.getTechnicianWorkloads(startDate, endDate));
    }
}
