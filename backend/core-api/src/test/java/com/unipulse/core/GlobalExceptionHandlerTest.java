package com.unipulse.core;

import com.unipulse.common.error.ApiException;
import com.unipulse.common.error.ErrorCodes;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@WithMockUser
@Import(GlobalExceptionHandlerTest.TestErrorController.class)
class GlobalExceptionHandlerTest {

    @RestController
    @RequestMapping("/test/errors")
    static class TestErrorController {
        @GetMapping("/not-found")
        public void throwNotFound() {
            throw ApiException.notFound("User not found");
        }

        @GetMapping("/conflict")
        public void throwConflict() {
            throw ApiException.conflict(ErrorCodes.STALE_VERSION, "Stale version detected");
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("ApiException notFound should format RFC 7807 problem+json with 404")
    void shouldFormatNotFoundAsProblemJson() throws Exception {
        mockMvc.perform(get("/test/errors/not-found"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.code").value(ErrorCodes.RESOURCE_NOT_FOUND))
                .andExpect(jsonPath("$.detail").value("User not found"));
    }

    @Test
    @DisplayName("ApiException conflict should format RFC 7807 problem+json with 409")
    void shouldFormatConflictAsProblemJson() throws Exception {
        mockMvc.perform(get("/test/errors/conflict"))
                .andExpect(status().isConflict())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.code").value(ErrorCodes.STALE_VERSION))
                .andExpect(jsonPath("$.detail").value("Stale version detected"));
    }
}
