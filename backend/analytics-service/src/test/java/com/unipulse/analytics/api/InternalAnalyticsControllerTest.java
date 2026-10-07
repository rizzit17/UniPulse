package com.unipulse.analytics.api;

import com.unipulse.analytics.service.AnalyticsReplayService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class InternalAnalyticsControllerTest {

    @Mock
    private AnalyticsReplayService replayService;

    @InjectMocks
    private InternalAnalyticsController controller;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(controller, "expectedInternalToken", "valid-secret-token");
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    @DisplayName("Rejects rebuild request without valid X-Internal-Token with 403 Forbidden")
    void shouldRejectWithoutToken() throws Exception {
        mockMvc.perform(post("/internal/analytics/rebuild")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("[]"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Invalid or missing internal token"));
    }

    @Test
    @DisplayName("Executes rebuild when valid X-Internal-Token is supplied")
    void shouldExecuteRebuild() throws Exception {
        mockMvc.perform(post("/internal/analytics/rebuild")
                        .header("X-Internal-Token", "valid-secret-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("[]"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REBUILT"));

        verify(replayService).resetAllAggregates();
    }
}
