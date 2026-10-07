package com.unipulse.assignment.strategy;

import com.unipulse.assignment.dto.RequestCreatedPayload;
import org.springframework.stereotype.Component;

import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Component
public class SkillMatchAssignmentStrategy implements AssignmentStrategy {

    @Override
    public String getName() {
        return "SKILL_MATCH";
    }

    @Override
    public Optional<TechnicianCandidate> selectAssignee(RequestCreatedPayload request, List<TechnicianCandidate> candidates) {
        if (candidates == null || candidates.isEmpty()) {
            return Optional.empty();
        }

        LocalTime now = LocalTime.now();

        // 1. Technicians with skills on shift
        Optional<TechnicianCandidate> skilledOnShift = candidates.stream()
                .filter(c -> c.isEligible(now) && hasRelevantSkills(c))
                .min(Comparator.comparingDouble(TechnicianCandidate::currentWorkload)
                        .thenComparing(c -> c.userId().toString()));

        if (skilledOnShift.isPresent()) {
            return skilledOnShift;
        }

        // 2. Technicians with skills regardless of shift
        Optional<TechnicianCandidate> skilledAny = candidates.stream()
                .filter(c -> c.currentWorkload() < c.maxActive() && hasRelevantSkills(c))
                .min(Comparator.comparingDouble(TechnicianCandidate::currentWorkload)
                        .thenComparing(c -> c.userId().toString()));

        if (skilledAny.isPresent()) {
            return skilledAny;
        }

        // 3. Fallback: least loaded eligible technician
        return candidates.stream()
                .filter(c -> c.currentWorkload() < c.maxActive())
                .min(Comparator.comparingDouble(TechnicianCandidate::currentWorkload)
                        .thenComparing(c -> c.userId().toString()));
    }

    private boolean hasRelevantSkills(TechnicianCandidate candidate) {
        return candidate.skills() != null && !candidate.skills().isEmpty();
    }
}
