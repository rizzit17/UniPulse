package com.unipulse.core.request.sla;

import com.unipulse.common.model.RequestPriority;
import com.unipulse.core.request.domain.ServiceRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Slf4j
@Component
public class TechnicianToDeptHeadEscalationHandler extends AbstractEscalationHandler {

    @Override
    public boolean canHandle(short escalationLevel) {
        return escalationLevel == 0;
    }

    @Override
    public void escalate(ServiceRequest request, Instant now) {
        log.warn("Escalating request {} from Level 0 (Technician) to Level 1 (Dept Head) due to SLA breach",
                request.getPublicId());

        RequestPriority oldPriority = request.getPriority();
        RequestPriority bumpedPriority = bumpPriority(oldPriority);

        request.setPriority(bumpedPriority);
        request.setEscalationLevel((short) 1);
        request.setUpdatedAt(now);

        log.info("Request {} priority escalated from {} to {}", request.getPublicId(), oldPriority, bumpedPriority);
    }

    private RequestPriority bumpPriority(RequestPriority priority) {
        return switch (priority) {
            case P4 -> RequestPriority.P3;
            case P3 -> RequestPriority.P2;
            case P2 -> RequestPriority.P1;
            case P1 -> RequestPriority.P1;
        };
    }
}
