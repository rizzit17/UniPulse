package com.unipulse.core.request.sla;

public record SlaSweepResult(
        int evaluated,
        int warningsIssued,
        int breachesEscalated
) {}
