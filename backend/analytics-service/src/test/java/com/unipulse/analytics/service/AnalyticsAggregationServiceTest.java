package com.unipulse.analytics.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.unipulse.analytics.dto.*;
import com.unipulse.analytics.model.*;
import com.unipulse.analytics.repo.*;
import com.unipulse.common.event.EventEnvelope;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnalyticsAggregationServiceTest {

    @Mock
    private DailyRequestStatsRepository dailyRequestStatsRepository;

    @Mock
    private TechnicianStatsRepository technicianStatsRepository;

    @Mock
    private HotspotRepository hotspotRepository;

    @Mock
    private ActivityFeedRepository activityFeedRepository;

    private AnalyticsAggregationService service;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        service = new AnalyticsAggregationService(
                dailyRequestStatsRepository,
                technicianStatsRepository,
                hotspotRepository,
                activityFeedRepository
        );
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    @DisplayName("Aggregates request.created.v1 event into stats, hotspots, and activity feed")
    void shouldAggregateRequestCreated() throws Exception {
        UUID reqId = UUID.randomUUID();
        UUID deptId = UUID.randomUUID();
        UUID catId = UUID.randomUUID();
        UUID requesterId = UUID.randomUUID();

        String jsonPayload = String.format("""
            {
                "publicId": "UP-2026-000101",
                "departmentId": "%s",
                "categoryId": "%s",
                "requesterId": "%s",
                "title": "Broken AC",
                "priority": "P2",
                "location": { "block": "Hostel-A", "room": "101" }
            }
        """, deptId, catId, requesterId);

        JsonNode payload = objectMapper.readTree(jsonPayload);
        EventEnvelope<JsonNode> envelope = EventEnvelope.of("request.created.v1", reqId, "corr-1", payload);

        service.processEvent(envelope);

        verify(dailyRequestStatsRepository).incrementCreated(any(LocalDate.class), eq(deptId), eq(catId));
        verify(hotspotRepository).recordComplaint(eq("Hostel-A"), eq("101"), eq(catId), any(Instant.class));

        ArgumentCaptor<ActivityFeedEntry> captor = ArgumentCaptor.forClass(ActivityFeedEntry.class);
        verify(activityFeedRepository).save(captor.capture());
        ActivityFeedEntry saved = captor.getValue();

        assertThat(saved.getRequestId()).isEqualTo(reqId);
        assertThat(saved.getPublicId()).isEqualTo("UP-2026-000101");
        assertThat(saved.getEventType()).isEqualTo("REQUEST_CREATED");
        assertThat(saved.getActorRole()).isEqualTo("REQUESTER");
        assertThat(saved.getSummary()).contains("Broken AC");
    }

    @Test
    @DisplayName("Aggregates request.assigned.v1 event into technician stats and activity feed")
    void shouldAggregateRequestAssigned() throws Exception {
        UUID reqId = UUID.randomUUID();
        UUID techId = UUID.randomUUID();
        UUID assignedBy = UUID.randomUUID();

        String jsonPayload = String.format("""
            {
                "publicId": "UP-2026-000102",
                "technicianId": "%s",
                "assignedBy": "%s",
                "assignedByName": "Dispatcher John"
            }
        """, techId, assignedBy);

        JsonNode payload = objectMapper.readTree(jsonPayload);
        EventEnvelope<JsonNode> envelope = EventEnvelope.of("request.assigned.v1", reqId, "corr-2", payload);

        service.processEvent(envelope);

        verify(technicianStatsRepository).incrementAssigned(any(LocalDate.class), eq(techId));

        ArgumentCaptor<ActivityFeedEntry> captor = ArgumentCaptor.forClass(ActivityFeedEntry.class);
        verify(activityFeedRepository).save(captor.capture());
        ActivityFeedEntry saved = captor.getValue();

        assertThat(saved.getRequestId()).isEqualTo(reqId);
        assertThat(saved.getEventType()).isEqualTo("REQUEST_ASSIGNED");
        assertThat(saved.getActorName()).isEqualTo("Dispatcher John");
    }

    @Test
    @DisplayName("Aggregates status change to RESOLVED into daily stats, throughput, and activity feed")
    void shouldAggregateRequestResolved() throws Exception {
        UUID reqId = UUID.randomUUID();
        UUID deptId = UUID.randomUUID();
        UUID catId = UUID.randomUUID();
        UUID techId = UUID.randomUUID();

        String jsonPayload = String.format("""
            {
                "publicId": "UP-2026-000103",
                "departmentId": "%s",
                "categoryId": "%s",
                "technicianId": "%s",
                "oldStatus": "IN_PROGRESS",
                "newStatus": "RESOLVED",
                "durationSeconds": 1200
            }
        """, deptId, catId, techId);

        JsonNode payload = objectMapper.readTree(jsonPayload);
        EventEnvelope<JsonNode> envelope = EventEnvelope.of("request.status-changed.v1", reqId, "corr-3", payload);

        service.processEvent(envelope);

        verify(dailyRequestStatsRepository).incrementResolved(any(LocalDate.class), eq(deptId), eq(catId));
        verify(technicianStatsRepository).incrementResolved(any(LocalDate.class), eq(techId), eq(1200L));

        ArgumentCaptor<ActivityFeedEntry> captor = ArgumentCaptor.forClass(ActivityFeedEntry.class);
        verify(activityFeedRepository).save(captor.capture());
        assertThat(captor.getValue().getEventType()).isEqualTo("STATUS_CHANGED");
    }

    @Test
    @DisplayName("Aggregates sla.breached.v1 event into daily stats and activity feed")
    void shouldAggregateSlaBreached() throws Exception {
        UUID reqId = UUID.randomUUID();
        UUID deptId = UUID.randomUUID();
        UUID catId = UUID.randomUUID();

        String jsonPayload = String.format("""
            {
                "publicId": "UP-2026-000104",
                "departmentId": "%s",
                "categoryId": "%s",
                "level": 2,
                "escalatedTo": "ADMIN"
            }
        """, deptId, catId);

        JsonNode payload = objectMapper.readTree(jsonPayload);
        EventEnvelope<JsonNode> envelope = EventEnvelope.of("sla.breached.v1", reqId, "corr-4", payload);

        service.processEvent(envelope);

        verify(dailyRequestStatsRepository).incrementBreached(any(LocalDate.class), eq(deptId), eq(catId));

        ArgumentCaptor<ActivityFeedEntry> captor = ArgumentCaptor.forClass(ActivityFeedEntry.class);
        verify(activityFeedRepository).save(captor.capture());
        assertThat(captor.getValue().getEventType()).isEqualTo("SLA_BREACHED");
        assertThat(captor.getValue().getSummary()).contains("ADMIN");
    }

    @Test
    @DisplayName("Computes dashboard overview metrics with SLA compliance and trends")
    void shouldComputeOverview() {
        LocalDate today = LocalDate.now();
        UUID deptId = UUID.randomUUID();
        UUID catId = UUID.randomUUID();

        DailyRequestStats stats = DailyRequestStats.builder()
                .id(new DailyRequestStatsId(today, deptId, catId))
                .createdCount(100)
                .resolvedCount(80)
                .breachedCount(4)
                .slaWarningCount(10)
                .build();

        TechnicianStats tech = TechnicianStats.builder()
                .id(new TechnicianStatsId(today, UUID.randomUUID()))
                .assignedCount(85)
                .resolvedCount(80)
                .totalResolveSeconds(80 * 1800L)
                .avgResolveSeconds(1800)
                .build();

        when(dailyRequestStatsRepository.findBetweenDates(any(), any())).thenReturn(List.of(stats));
        when(technicianStatsRepository.findBetweenDates(any(), any())).thenReturn(List.of(tech));
        when(hotspotRepository.count()).thenReturn(3L);

        OverviewStatsResponse overview = service.getOverview(today.minusDays(7), today, null);

        assertThat(overview.totalCreated()).isEqualTo(100);
        assertThat(overview.totalResolved()).isEqualTo(80);
        assertThat(overview.totalBreached()).isEqualTo(4);
        assertThat(overview.slaComplianceRate()).isEqualTo(95.0); // (80 - 4)/80 = 95%
        assertThat(overview.avgResolveMinutes()).isEqualTo(30);
        assertThat(overview.activeHotspotsCount()).isEqualTo(3);
        assertThat(overview.dailyTrend()).hasSize(1);
    }

    @Test
    @DisplayName("Returns top repeat complaint hotspots")
    void shouldGetTopHotspots() {
        Hotspot h1 = Hotspot.builder()
                .id(new HotspotId("Hostel-A", "101", UUID.randomUUID()))
                .count30d(15)
                .lastReportedAt(Instant.now())
                .build();

        when(hotspotRepository.findTopHotspots(any(Pageable.class))).thenReturn(List.of(h1));

        List<HotspotDto> results = service.getTopHotspots(10);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).locationBlock()).isEqualTo("Hostel-A");
        assertThat(results.get(0).count30d()).isEqualTo(15);
    }

    @Test
    @DisplayName("Retrieves request activity feed timeline ordered by timestamp descending")
    void shouldGetRequestActivity() {
        UUID reqId = UUID.randomUUID();
        ActivityFeedEntry e1 = ActivityFeedEntry.builder()
                .id("feed-1")
                .requestId(reqId)
                .eventType("REQUEST_CREATED")
                .summary("Request created")
                .timestamp(Instant.now().minusSeconds(3600))
                .build();
        ActivityFeedEntry e2 = ActivityFeedEntry.builder()
                .id("feed-2")
                .requestId(reqId)
                .eventType("REQUEST_ASSIGNED")
                .summary("Technician assigned")
                .timestamp(Instant.now())
                .build();

        when(activityFeedRepository.findByRequestIdOrderByTimestampDesc(reqId)).thenReturn(List.of(e2, e1));

        List<ActivityFeedDto> timeline = service.getRequestActivity(reqId);

        assertThat(timeline).hasSize(2);
        assertThat(timeline.get(0).eventType()).isEqualTo("REQUEST_ASSIGNED");
        assertThat(timeline.get(1).eventType()).isEqualTo("REQUEST_CREATED");
    }
}
