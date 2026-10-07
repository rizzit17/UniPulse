package com.unipulse.core.request.sla;

import com.unipulse.core.request.domain.ServiceRequest;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
@RequiredArgsConstructor
public class EscalationChain {

    private final TechnicianToDeptHeadEscalationHandler technicianHandler;
    private final DeptHeadToAdminEscalationHandler deptHeadHandler;

    @PostConstruct
    public void initChain() {
        technicianHandler.setNext(deptHeadHandler);
    }

    public void escalate(ServiceRequest request, Instant now) {
        if (technicianHandler.canHandle(request.getEscalationLevel())) {
            technicianHandler.escalate(request, now);
        } else if (deptHeadHandler.canHandle(request.getEscalationLevel())) {
            deptHeadHandler.escalate(request, now);
        }
    }
}
