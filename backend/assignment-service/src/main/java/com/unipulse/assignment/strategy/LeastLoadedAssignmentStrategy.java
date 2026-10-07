package com.unipulse.assignment.strategy;

import com.unipulse.assignment.dto.RequestCreatedPayload;
import org.springframework.stereotype.Component;

import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Component
public class LeastLoadedAssignmentStrategy implements AssignmentStrategy {

    @Override
    public String getName() {
        return "LEAST_LOADED";
    }

    @Override
    public Optional<TechnicianCandidate> selectAssignee(RequestCreatedPayload request, List<TechnicianCandidate> candidates) {
        if (candidates == null || candidates.isEmpty()) {
            return Optional.empty();
        }

        LocalTime now = LocalTime.now();

        // 1. First preference: on-shift and under max capacity
        Optional<TechnicianCandidate> bestEligible = candidates.stream()
                .filter(c -> c.isEligible(now))
                .min(Comparator.comparingDouble(TechnicianCandidate::currentWorkload)
                        .thenComparing(c -> c.userId().toString()));

        if (bestEligible.isPresent()) {
            return bestEligible;
        }

        // 2. Fallback: any technician under max capacity even if outside shift window
        return candidates.stream()
                .filter(c -> c.currentWorkload() < c.maxActive())
                .min(Comparator.comparingDouble(TechnicianCandidate::currentWorkload)
                        .thenComparing(c -> c.userId().toString()));
    }
}
