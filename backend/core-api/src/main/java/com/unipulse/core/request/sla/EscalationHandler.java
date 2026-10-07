package com.unipulse.core.request.sla;

import com.unipulse.core.request.domain.ServiceRequest;

import java.time.Instant;

public interface EscalationHandler {

    boolean canHandle(short escalationLevel);

    void escalate(ServiceRequest request, Instant now);

    void setNext(EscalationHandler next);
}
