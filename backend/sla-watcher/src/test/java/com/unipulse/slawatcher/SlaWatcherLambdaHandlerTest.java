package com.unipulse.slawatcher;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import org.mockito.ArgumentMatchers;

@ExtendWith(MockitoExtension.class)
class SlaWatcherLambdaHandlerTest {

    @Mock
    private HttpClient httpClient;

    @Mock
    private HttpResponse<String> httpResponse;

    @Test
    @DisplayName("Successfully triggers internal SLA sweep and returns response body")
    void shouldSuccessfullyTriggerSweep() throws Exception {
        when(httpResponse.statusCode()).thenReturn(200);
        when(httpResponse.body()).thenReturn("{\"evaluated\":10,\"warningsIssued\":2,\"breachesEscalated\":1}");
        when(httpClient.send(any(HttpRequest.class), ArgumentMatchers.<HttpResponse.BodyHandler<String>>any()))
                .thenReturn(httpResponse);

        SlaWatcherLambdaHandler handler = new SlaWatcherLambdaHandler(
                httpClient, "http://localhost:8080", "secret-test-token"
        );

        String result = handler.handleRequest(Map.of(), null);

        assertThat(result).contains("breachesEscalated");
    }

    @Test
    @DisplayName("Throws runtime exception when core-api returns error status code")
    void shouldThrowOnHttpError() throws Exception {
        when(httpResponse.statusCode()).thenReturn(403);
        when(httpResponse.body()).thenReturn("{\"error\":\"Forbidden\"}");
        when(httpClient.send(any(HttpRequest.class), ArgumentMatchers.<HttpResponse.BodyHandler<String>>any()))
                .thenReturn(httpResponse);

        SlaWatcherLambdaHandler handler = new SlaWatcherLambdaHandler(
                httpClient, "http://localhost:8080", "invalid-token"
        );

        assertThatThrownBy(() -> handler.handleRequest(Map.of(), null))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("status 403");
    }
}
