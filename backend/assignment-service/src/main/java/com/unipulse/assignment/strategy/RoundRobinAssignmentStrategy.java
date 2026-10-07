package com.unipulse.assignment.strategy;

import com.unipulse.assignment.dto.RequestCreatedPayload;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class RoundRobinAssignmentStrategy implements AssignmentStrategy {

    private final Map<UUID, AtomicInteger> departmentIndices = new ConcurrentHashMap<>();

    @Override
    public String getName() {
        return "ROUND_ROBIN";
    }

    @Override
    public Optional<TechnicianCandidate> selectAssignee(RequestCreatedPayload request, List<TechnicianCandidate> candidates) {
        if (candidates == null || candidates.isEmpty()) {
            return Optional.empty();
        }

        List<TechnicianCandidate> eligible = candidates.stream()
                .filter(c -> c.currentWorkload() < c.maxActive())
                .toList();

        if (eligible.isEmpty()) {
            return Optional.empty();
        }

        UUID deptId = request.departmentId();
        AtomicInteger counter = departmentIndices.computeIfAbsent(deptId, k -> new AtomicInteger(0));
        int idx = Math.abs(counter.getAndIncrement() % eligible.size());
        return Optional.of(eligible.get(idx));
    }
}
