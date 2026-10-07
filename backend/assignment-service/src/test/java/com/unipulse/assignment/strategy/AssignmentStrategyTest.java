package com.unipulse.assignment.strategy;

import com.unipulse.assignment.dto.RequestCreatedPayload;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class AssignmentStrategyTest {

    private final UUID deptId = UUID.randomUUID();
    private final RequestCreatedPayload sampleRequest = new RequestCreatedPayload(
            UUID.randomUUID(),
            "UP-2026-000001",
            UUID.randomUUID(),
            deptId,
            UUID.randomUUID(),
            "P1",
            "Science Block"
    );

    @Test
    @DisplayName("LeastLoadedStrategy selects candidate with minimum active workload")
    void shouldSelectCandidateWithLowestWorkload() {
        LeastLoadedAssignmentStrategy strategy = new LeastLoadedAssignmentStrategy();

        UUID techA = UUID.randomUUID();
        UUID techB = UUID.randomUUID();

        // techA has load 5.0, techB has load 2.0 (both 24/7 shifts)
        TechnicianCandidate candidateA = new TechnicianCandidate(
                techA, deptId, List.of("HVAC"), LocalTime.of(0, 0), LocalTime.of(23, 59), 8, 5.0
        );
        TechnicianCandidate candidateB = new TechnicianCandidate(
                techB, deptId, List.of("HVAC"), LocalTime.of(0, 0), LocalTime.of(23, 59), 8, 2.0
        );

        Optional<TechnicianCandidate> selected = strategy.selectAssignee(sampleRequest, List.of(candidateA, candidateB));

        assertThat(selected).isPresent();
        assertThat(selected.get().userId()).isEqualTo(techB);
    }

    @Test
    @DisplayName("LeastLoadedStrategy excludes candidate at max capacity")
    void shouldExcludeOverCapacityCandidates() {
        LeastLoadedAssignmentStrategy strategy = new LeastLoadedAssignmentStrategy();

        UUID techA = UUID.randomUUID();
        UUID techB = UUID.randomUUID();

        // techA has load 8.0 with maxActive 8 (full)
        TechnicianCandidate candidateA = new TechnicianCandidate(
                techA, deptId, List.of("HVAC"), LocalTime.of(0, 0), LocalTime.of(23, 59), 8, 8.0
        );
        // techB has load 4.0 with maxActive 8 (available)
        TechnicianCandidate candidateB = new TechnicianCandidate(
                techB, deptId, List.of("HVAC"), LocalTime.of(0, 0), LocalTime.of(23, 59), 8, 4.0
        );

        Optional<TechnicianCandidate> selected = strategy.selectAssignee(sampleRequest, List.of(candidateA, candidateB));

        assertThat(selected).isPresent();
        assertThat(selected.get().userId()).isEqualTo(techB);
    }

    @Test
    @DisplayName("RoundRobinStrategy alternates between eligible technicians")
    void shouldCycleTechniciansEvenly() {
        RoundRobinAssignmentStrategy strategy = new RoundRobinAssignmentStrategy();

        UUID techA = UUID.randomUUID();
        UUID techB = UUID.randomUUID();

        TechnicianCandidate candidateA = new TechnicianCandidate(
                techA, deptId, List.of("HVAC"), LocalTime.of(0, 0), LocalTime.of(23, 59), 8, 1.0
        );
        TechnicianCandidate candidateB = new TechnicianCandidate(
                techB, deptId, List.of("HVAC"), LocalTime.of(0, 0), LocalTime.of(23, 59), 8, 1.0
        );

        List<TechnicianCandidate> candidates = List.of(candidateA, candidateB);

        Optional<TechnicianCandidate> first = strategy.selectAssignee(sampleRequest, candidates);
        Optional<TechnicianCandidate> second = strategy.selectAssignee(sampleRequest, candidates);

        assertThat(first).isPresent();
        assertThat(second).isPresent();
        assertThat(first.get().userId()).isNotEqualTo(second.get().userId());
    }

    @Test
    @DisplayName("SkillMatchStrategy prefers skilled technicians")
    void shouldPreferSkilledTechnicians() {
        SkillMatchAssignmentStrategy strategy = new SkillMatchAssignmentStrategy();

        UUID techUnskilled = UUID.randomUUID();
        UUID techSkilled = UUID.randomUUID();

        TechnicianCandidate unskilled = new TechnicianCandidate(
                techUnskilled, deptId, List.of(), LocalTime.of(0, 0), LocalTime.of(23, 59), 8, 1.0
        );
        TechnicianCandidate skilled = new TechnicianCandidate(
                techSkilled, deptId, List.of("Electrical", "HVAC"), LocalTime.of(0, 0), LocalTime.of(23, 59), 8, 2.0
        );

        Optional<TechnicianCandidate> selected = strategy.selectAssignee(sampleRequest, List.of(unskilled, skilled));

        assertThat(selected).isPresent();
        assertThat(selected.get().userId()).isEqualTo(techSkilled);
    }
}
