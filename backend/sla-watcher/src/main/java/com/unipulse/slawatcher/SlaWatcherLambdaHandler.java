package com.unipulse.slawatcher;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.LambdaLogger;
import com.amazonaws.services.lambda.runtime.RequestHandler;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

/**
 * AWS Lambda handler triggered every minute by EventBridge to trigger SLA sweep on core-api.
 */
public class SlaWatcherLambdaHandler implements RequestHandler<Map<String, Object>, String> {

    private final HttpClient httpClient;
    private final String coreApiUrl;
    private final String serviceToken;

    public SlaWatcherLambdaHandler() {
        this(
                HttpClient.newBuilder()
                        .connectTimeout(Duration.ofSeconds(5))
                        .build(),
                System.getenv().getOrDefault("CORE_API_URL", "http://localhost:8080"),
                System.getenv().getOrDefault("INTERNAL_SERVICE_TOKEN", "unipulse-internal-secret-token")
        );
    }

    public SlaWatcherLambdaHandler(HttpClient httpClient, String coreApiUrl, String serviceToken) {
        this.httpClient = httpClient;
        this.coreApiUrl = coreApiUrl;
        this.serviceToken = serviceToken;
    }

    @Override
    public String handleRequest(Map<String, Object> input, Context context) {
        LambdaLogger logger = (context != null) ? context.getLogger() : null;
        log(logger, "SlaWatcher Lambda invoked. Triggering SLA sweep at " + coreApiUrl);

        try {
            URI endpoint = URI.create(coreApiUrl + "/internal/sla/sweep");
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(endpoint)
                    .timeout(Duration.ofSeconds(15))
                    .header("X-Internal-Token", serviceToken)
                    .POST(HttpRequest.BodyPublishers.noBody())
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log(logger, "SLA sweep successfully executed. Response: " + response.body());
                return response.body();
            } else {
                String error = "SLA sweep endpoint returned status " + response.statusCode() + ": " + response.body();
                log(logger, error);
                throw new RuntimeException(error);
            }
        } catch (Exception e) {
            String errorMsg = "Failed to execute SLA sweep: " + e.getMessage();
            log(logger, errorMsg);
            throw new RuntimeException(errorMsg, e);
        }
    }

    private void log(LambdaLogger logger, String msg) {
        if (logger != null) {
            logger.log(msg + "\n");
        } else {
            System.out.println(msg);
        }
    }
}
