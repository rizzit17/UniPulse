package com.unipulse.core;

import com.unipulse.common.constant.AppHeaders;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UniPulseCoreApplicationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("Application context loads and /actuator/health returns UP")
    void actuatorHealthShouldReturnUp() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    @DisplayName("Request should generate X-Correlation-ID if none is provided")
    void requestShouldGenerateCorrelationId() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(header().exists(AppHeaders.CORRELATION_ID));
    }

    @Test
    @DisplayName("Request should propagate existing X-Correlation-ID")
    void requestShouldPropagateCorrelationId() throws Exception {
        String testCorrelationId = "test-corr-12345";
        mockMvc.perform(get("/actuator/health")
                        .header(AppHeaders.CORRELATION_ID, testCorrelationId))
                .andExpect(status().isOk())
                .andExpect(header().string(AppHeaders.CORRELATION_ID, testCorrelationId));
    }

    @Test
    @DisplayName("OpenAPI JSON documentation should be accessible at /v3/api-docs")
    void openApiDocsShouldBeAvailable() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("UniPulse Core API")));
    }
}
