package com.unipulse.analytics.api;

import com.unipulse.analytics.dto.*;
import com.unipulse.analytics.service.AnalyticsAggregationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AnalyticsControllerTest {

    @Mock
    private AnalyticsAggregationService aggregationService;

    @InjectMocks
    private AnalyticsController controller;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    @DisplayName("GET /api/v1/analytics/overview returns aggregated overview metrics")
    void shouldReturnOverview() throws Exception {
        OverviewStatsResponse response = new OverviewStatsResponse(
                120, 110, 5, 12, 95.5, 25, 4,
                List.of(new DailyTrendDto(LocalDate.now(), 10, 9, 0))
        );

        when(aggregationService.getOverview(any(), any(), any())).thenReturn(response);

        mockMvc.perform(get("/api/v1/analytics/overview"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalCreated").value(120))
                .andExpect(jsonPath("$.totalResolved").value(110))
                .andExpect(jsonPath("$.slaComplianceRate").value(95.5));
    }

    @Test
    @DisplayName("GET /api/v1/analytics/sla returns compliance and breakdown")
    void shouldReturnSla() throws Exception {
        SlaMetricsResponse response = new SlaMetricsResponse(
                120, 5, 12, 95.5,
                List.of(new DepartmentSlaDto(UUID.randomUUID(), 50, 48, 2, 96.0))
        );

        when(aggregationService.getSlaMetrics(any(), any(), any())).thenReturn(response);

        mockMvc.perform(get("/api/v1/analytics/sla"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalEvaluated").value(120))
                .andExpect(jsonPath("$.complianceRate").value(95.5))
                .andExpect(jsonPath("$.departmentBreakdown[0].complianceRate").value(96.0));
    }

    @Test
    @DisplayName("GET /api/v1/analytics/hotspots returns repeat complaint locations")
    void shouldReturnHotspots() throws Exception {
        HotspotDto hotspot = new HotspotDto("Hostel-B", "304", UUID.randomUUID(), 8, Instant.now());

        when(aggregationService.getTopHotspots(anyInt())).thenReturn(List.of(hotspot));

        mockMvc.perform(get("/api/v1/analytics/hotspots?limit=5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].locationBlock").value("Hostel-B"))
                .andExpect(jsonPath("$[0].count30d").value(8));
    }

    @Test
    @DisplayName("GET /api/v1/analytics/workload returns technician workload throughput")
    void shouldReturnWorkload() throws Exception {
        TechnicianWorkloadDto workload = new TechnicianWorkloadDto(UUID.randomUUID(), 20, 18, 1200, 20.0);

        when(aggregationService.getTechnicianWorkloads(any(), any())).thenReturn(List.of(workload));

        mockMvc.perform(get("/api/v1/analytics/workload"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].assignedCount").value(20))
                .andExpect(jsonPath("$[0].avgResolveMinutes").value(20.0));
    }
}
