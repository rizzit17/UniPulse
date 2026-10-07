package com.unipulse.assignment.strategy;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public record TechnicianCandidate(
        UUID userId,
        UUID departmentId,
        List<String> skills,
        LocalTime shiftStart,
        LocalTime shiftEnd,
        int maxActive,
        double currentWorkload
) {
    public boolean isEligible(LocalTime currentTime) {
        if (currentWorkload >= maxActive) {
            return false;
        }
        if (shiftStart != null && shiftEnd != null) {
            if (shiftStart.isBefore(shiftEnd)) {
                return !currentTime.isBefore(shiftStart) && !currentTime.isAfter(shiftEnd);
            } else {
                return !currentTime.isBefore(shiftStart) || !currentTime.isAfter(shiftEnd);
            }
        }
        return true;
    }
}
