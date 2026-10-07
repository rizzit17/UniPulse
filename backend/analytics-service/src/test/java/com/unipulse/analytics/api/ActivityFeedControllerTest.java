package com.unipulse.analytics.api;

import com.unipulse.analytics.dto.ActivityFeedDto;
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
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ActivityFeedControllerTest {

    @Mock
    private AnalyticsAggregationService aggregationService;

    @InjectMocks
    private ActivityFeedController controller;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    @DisplayName("GET /api/v1/analytics/requests/{id}/activity returns request activity timeline")
    void shouldReturnActivityTimeline() throws Exception {
        UUID reqId = UUID.randomUUID();
        ActivityFeedDto item = new ActivityFeedDto(
                "feed-1",
                reqId,
                "UP-2026-000300",
                "REQUEST_CREATED",
                UUID.randomUUID(),
                "Alice Student",
                "REQUESTER",
                "Request raised: Leaking pipe",
                Map.of("priority", "P2"),
                Instant.now()
        );

        when(aggregationService.getRequestActivity(eq(reqId))).thenReturn(List.of(item));

        mockMvc.perform(get("/api/v1/analytics/requests/{id}/activity", reqId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].publicId").value("UP-2026-000300"))
                .andExpect(jsonPath("$[0].eventType").value("REQUEST_CREATED"))
                .andExpect(jsonPath("$[0].summary").value("Request raised: Leaking pipe"));
    }
}
