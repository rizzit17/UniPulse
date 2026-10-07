package com.unipulse.core.request.sla;

import com.unipulse.common.error.ApiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InternalSlaControllerTest {

    @Mock
    private SlaSweepService slaSweepService;

    private InternalSlaController controller;

    @BeforeEach
    void setUp() {
        controller = new InternalSlaController(slaSweepService);
        ReflectionTestUtils.setField(controller, "serviceToken", "valid-test-token");
    }

    @Test
    @DisplayName("Executes sweep when valid internal token is provided")
    void shouldExecuteSweepOnValidToken() {
        SlaSweepResult mockResult = new SlaSweepResult(10, 2, 1);
        when(slaSweepService.sweep()).thenReturn(mockResult);

        ResponseEntity<SlaSweepResult> response = controller.triggerSweep("valid-test-token");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        SlaSweepResult body = response.getBody();
        assertThat(body).isNotNull();
        if (body != null) {
            assertThat(body.breachesEscalated()).isEqualTo(1);
        }
        verify(slaSweepService).sweep();
    }

    @Test
    @DisplayName("Rejects request with 403 when internal token is invalid or missing")
    void shouldRejectOnInvalidToken() {
        assertThatThrownBy(() -> controller.triggerSweep("wrong-token"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Unauthorized internal service token");

        assertThatThrownBy(() -> controller.triggerSweep(null))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Unauthorized internal service token");
    }
}
