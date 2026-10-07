package com.unipulse.analytics.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.unipulse.analytics.service.AnalyticsReplayService;
import com.unipulse.common.event.EventEnvelope;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/internal/analytics")
@RequiredArgsConstructor
public class InternalAnalyticsController {

    private final AnalyticsReplayService replayService;

    @Value("${unipulse.internal.token:unipulse-internal-secret-token-2026}")
    private String expectedInternalToken;

    @PostMapping("/rebuild")
    public ResponseEntity<?> rebuildAnalytics(
            @RequestHeader(value = "X-Internal-Token", required = false) String token,
            @RequestBody(required = false) List<EventEnvelope<JsonNode>> eventsToReplay
    ) {
        if (token == null || !token.equals(expectedInternalToken)) {
            log.warn("Unauthorized attempt to access /internal/analytics/rebuild with token: {}", token);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Invalid or missing internal token"));
        }

        replayService.resetAllAggregates();

        int replayedCount = 0;
        if (eventsToReplay != null && !eventsToReplay.isEmpty()) {
            replayedCount = replayService.replayBatch(eventsToReplay);
        }

        return ResponseEntity.ok(Map.of(
                "status", "REBUILT",
                "replayedEvents", replayedCount,
                "message", "Analytics aggregations successfully reset and rebuilt"
        ));
    }
}
