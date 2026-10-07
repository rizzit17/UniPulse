package com.unipulse.core.request.sla;

import com.unipulse.common.error.ApiException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/internal/sla")
@RequiredArgsConstructor
@Tag(name = "Internal SLA", description = "Internal service endpoints for scheduled SLA sweeps")
public class InternalSlaController {

    private final SlaSweepService slaSweepService;

    @Value("${unipulse.internal.service-token:unipulse-internal-secret-token}")
    private String serviceToken;

    @PostMapping("/sweep")
    @Operation(summary = "Execute scheduled SLA breach and warning sweep")
    public ResponseEntity<SlaSweepResult> triggerSweep(
            @RequestHeader(value = "X-Internal-Token", required = false) String token
    ) {
        if (token == null || !token.equals(serviceToken)) {
            log.warn("Rejected SLA sweep trigger: invalid or missing internal token");
            throw ApiException.forbidden("Unauthorized internal service token");
        }

        log.info("Triggering SLA sweep via internal endpoint");
        SlaSweepResult result = slaSweepService.sweep();
        return ResponseEntity.ok(result);
    }
}
