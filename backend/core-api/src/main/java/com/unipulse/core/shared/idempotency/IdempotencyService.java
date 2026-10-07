package com.unipulse.core.shared.idempotency;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class IdempotencyService {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public <T> Optional<T> getStoredResponse(String idempotencyKey, Class<T> clazz) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return Optional.empty();
        }

        String key = "idem:" + idempotencyKey.trim();
        try {
            String json = redisTemplate.opsForValue().get(key);
            if (json != null) {
                log.info("Returning cached response for idempotency key: {}", idempotencyKey);
                return Optional.of(objectMapper.readValue(json, clazz));
            }
        } catch (Exception e) {
            log.warn("Redis error while checking idempotency key {}: {}", idempotencyKey, e.getMessage());
        }
        return Optional.empty();
    }

    public void storeResponse(String idempotencyKey, Object response, Duration ttl) {
        if (idempotencyKey == null || idempotencyKey.isBlank() || response == null) {
            return;
        }

        String key = "idem:" + idempotencyKey.trim();
        try {
            String json = objectMapper.writeValueAsString(response);
            redisTemplate.opsForValue().set(key, json, ttl);
            log.debug("Stored response for idempotency key: {}", idempotencyKey);
        } catch (Exception e) {
            log.warn("Failed to store idempotency response for key {}: {}", idempotencyKey, e.getMessage());
        }
    }
}
