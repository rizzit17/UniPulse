package com.unipulse.analytics.service;

import com.unipulse.analytics.dto.OverviewStatsResponse;
import com.unipulse.analytics.dto.SlaMetricsResponse;
import com.unipulse.analytics.model.DailyRequestStats;
import com.unipulse.analytics.model.DailyRequestStatsId;
import com.unipulse.analytics.model.TechnicianStats;
import com.unipulse.analytics.model.TechnicianStatsId;
import com.unipulse.analytics.repo.ActivityFeedRepository;
import com.unipulse.analytics.repo.DailyRequestStatsRepository;
import com.unipulse.analytics.repo.HotspotRepository;
import com.unipulse.analytics.repo.TechnicianStatsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnalyticsPerformanceBenchmarkTest {

    @Mock
    private DailyRequestStatsRepository dailyRequestStatsRepository;

    @Mock
    private TechnicianStatsRepository technicianStatsRepository;

    @Mock
    private HotspotRepository hotspotRepository;

    @Mock
    private ActivityFeedRepository activityFeedRepository;

    private AnalyticsAggregationService service;

    @BeforeEach
    void setUp() {
        service = new AnalyticsAggregationService(
                dailyRequestStatsRepository,
                technicianStatsRepository,
                hotspotRepository,
                activityFeedRepository
        );
    }

    @Test
    @DisplayName("Dashboard overview responds in <100ms on pre-aggregated data representing 100,000 requests")
    void shouldRespondUnder100msFor100kRequests() {
        LocalDate startDate = LocalDate.now().minusDays(30);
        LocalDate endDate = LocalDate.now();

        List<DailyRequestStats> statsList = new ArrayList<>();
        List<TechnicianStats> techList = new ArrayList<>();

        UUID[] depts = new UUID[]{UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID()};
        UUID[] categories = new UUID[12];
        for (int i = 0; i < 12; i++) {
            categories[i] = UUID.randomUUID();
        }

        UUID[] technicians = new UUID[20];
        for (int i = 0; i < 20; i++) {
            technicians[i] = UUID.randomUUID();
        }

        // 30 days * 4 depts * 12 categories = 1,440 entries representing 100,000 requests
        for (int d = 0; d < 30; d++) {
            LocalDate day = startDate.plusDays(d);
            for (UUID dept : depts) {
                for (UUID cat : categories) {
                    statsList.add(DailyRequestStats.builder()
                            .id(new DailyRequestStatsId(day, dept, cat))
                            .createdCount(70)
                            .resolvedCount(65)
                            .breachedCount(2)
                            .slaWarningCount(8)
                            .build());
                }
            }
            for (UUID tech : technicians) {
                techList.add(TechnicianStats.builder()
                        .id(new TechnicianStatsId(day, tech))
                        .assignedCount(165)
                        .resolvedCount(155)
                        .totalResolveSeconds(155 * 1500L)
                        .avgResolveSeconds(1500)
                        .build());
            }
        }

        when(dailyRequestStatsRepository.findBetweenDates(any(), any())).thenReturn(statsList);
        when(technicianStatsRepository.findBetweenDates(any(), any())).thenReturn(techList);
        when(hotspotRepository.count()).thenReturn(25L);

        // Warm up JVM
        service.getOverview(startDate, endDate, null);

        // Timed run
        long startNanos = System.nanoTime();
        OverviewStatsResponse response = service.getOverview(startDate, endDate, null);
        long elapsedMs = (System.nanoTime() - startNanos) / 1_000_000;

        assertThat(response.totalCreated()).isGreaterThanOrEqualTo(100_000L);
        assertThat(response.slaComplianceRate()).isGreaterThan(95.0);
        assertThat(elapsedMs).as("Query execution time must be under 100ms").isLessThan(100L);

        // Also test SLA metrics endpoint latency
        startNanos = System.nanoTime();
        SlaMetricsResponse slaResponse = service.getSlaMetrics(startDate, endDate, null);
        long slaElapsedMs = (System.nanoTime() - startNanos) / 1_000_000;

        assertThat(slaResponse.totalEvaluated()).isGreaterThanOrEqualTo(100_000L);
        assertThat(slaResponse.departmentBreakdown()).hasSize(4);
        assertThat(slaElapsedMs).as("SLA metric latency must be under 100ms").isLessThan(100L);
    }
}
