package com.unipulse.analytics.api;

import com.unipulse.analytics.dto.ActivityFeedDto;
import com.unipulse.analytics.service.AnalyticsAggregationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class ActivityFeedController {

    private final AnalyticsAggregationService aggregationService;

    @GetMapping("/requests/{id}/activity")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ActivityFeedDto>> getRequestActivity(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(aggregationService.getRequestActivity(id));
    }
}
