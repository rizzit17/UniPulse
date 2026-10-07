package com.unipulse.core.request.sla;

import com.unipulse.core.request.domain.ServiceRequest;

import java.time.Instant;

public abstract class AbstractEscalationHandler implements EscalationHandler {

    protected EscalationHandler next;

    @Override
    public void setNext(EscalationHandler next) {
        this.next = next;
    }

    public void handle(ServiceRequest request, Instant now) {
        if (canHandle(request.getEscalationLevel())) {
            escalate(request, now);
        } else if (next != null) {
            next.escalate(request, now);
        }
    }
}
