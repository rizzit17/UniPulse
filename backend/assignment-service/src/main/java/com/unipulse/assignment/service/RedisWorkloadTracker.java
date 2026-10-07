package com.unipulse.assignment.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RedisWorkloadTracker {

    private final StringRedisTemplate redisTemplate;

    public double getWorkload(UUID departmentId, UUID userId) {
        try {
            String key = buildKey(departmentId);
            Double score = redisTemplate.opsForZSet().score(key, userId.toString());
            return score != null ? score : 0.0;
        } catch (Exception e) {
            log.warn("Redis unavailable for workload check: {}", e.getMessage());
            return 0.0;
        }
    }

    public void incrementWorkload(UUID departmentId, UUID userId, String priority) {
        double weight = getPriorityWeight(priority);
        try {
            String key = buildKey(departmentId);
            redisTemplate.opsForZSet().incrementScore(key, userId.toString(), weight);
            log.debug("Incremented workload for tech {} in dept {} by {}", userId, departmentId, weight);
        } catch (Exception e) {
            log.warn("Failed to increment Redis workload for tech {}: {}", userId, e.getMessage());
        }
    }

    public static double getPriorityWeight(String priority) {
        if (priority == null) {
            return 2.0;
        }
        return switch (priority.toUpperCase()) {
            case "P1" -> 5.0;
            case "P2" -> 3.0;
            case "P3" -> 2.0;
            case "P4" -> 1.0;
            default -> 2.0;
        };
    }

    private String buildKey(UUID departmentId) {
        return "workload:" + departmentId;
    }
}
