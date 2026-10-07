package com.unipulse.assignment.strategy;

import com.unipulse.assignment.dto.RequestCreatedPayload;

import java.util.List;
import java.util.Optional;

public interface AssignmentStrategy {
    String getName();
    Optional<TechnicianCandidate> selectAssignee(RequestCreatedPayload request, List<TechnicianCandidate> candidates);
}
