package com.unipulse.core.request.sla;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Profile("!prod")
@ConditionalOnProperty(name = "unipulse.sla.scheduler.enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
public class LocalSlaScheduler {

    private final SlaSweepService slaSweepService;

    @Scheduled(fixedDelayString = "${unipulse.sla.sweep-interval-ms:60000}")
    public void runLocalSweep() {
        try {
            log.debug("Executing scheduled local SLA sweep cycle");
            SlaSweepResult result = slaSweepService.sweep();
            if (result.warningsIssued() > 0 || result.breachesEscalated() > 0) {
                log.info("Local SLA sweep cycle finished: {} warnings, {} breaches escalated",
                        result.warningsIssued(), result.breachesEscalated());
            }
        } catch (Exception e) {
            log.error("Error occurred during local SLA sweep execution: {}", e.getMessage(), e);
        }
    }
}
