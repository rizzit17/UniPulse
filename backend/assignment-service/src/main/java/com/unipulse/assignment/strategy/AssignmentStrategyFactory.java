package com.unipulse.assignment.strategy;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Component
public class AssignmentStrategyFactory {

    private final Map<String, AssignmentStrategy> strategies;
    private final String activeStrategyName;

    public AssignmentStrategyFactory(
            List<AssignmentStrategy> strategyList,
            @Value("${unipulse.assignment.strategy:LEAST_LOADED}") String activeStrategyName
    ) {
        this.strategies = strategyList.stream()
                .collect(Collectors.toMap(s -> s.getName().toUpperCase(), Function.identity()));
        this.activeStrategyName = activeStrategyName.toUpperCase();
        log.info("Initialized AssignmentStrategyFactory with active strategy: {}", this.activeStrategyName);
    }

    public AssignmentStrategy getActiveStrategy() {
        AssignmentStrategy strategy = strategies.get(activeStrategyName);
        if (strategy != null) {
            return strategy;
        }
        log.warn("Unknown assignment strategy '{}', falling back to LEAST_LOADED", activeStrategyName);
        return strategies.getOrDefault("LEAST_LOADED", strategies.values().iterator().next());
    }
}
