package com.unipulse.core.request.sla;

import com.unipulse.core.request.domain.ServiceRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Slf4j
@Component
public class DeptHeadToAdminEscalationHandler extends AbstractEscalationHandler {

    @Override
    public boolean canHandle(short escalationLevel) {
        return escalationLevel == 1;
    }

    @Override
    public void escalate(ServiceRequest request, Instant now) {
        log.warn("Escalating request {} from Level 1 (Dept Head) to Level 2 (Admin) due to persistent SLA breach",
                request.getPublicId());

        request.setEscalationLevel((short) 2);
        request.setUpdatedAt(now);
    }
}
