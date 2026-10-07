package com.unipulse.core.shared.cache;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Duration;
import java.util.concurrent.ThreadLocalRandom;
import java.util.function.Supplier;

@Slf4j
@Service
public class RedisCacheService {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final Counter hitCounter;
    private final Counter missCounter;

    public RedisCacheService(
            StringRedisTemplate redisTemplate,
            ObjectMapper objectMapper,
            MeterRegistry meterRegistry
    ) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.hitCounter = Counter.builder("cache.requests")
                .tag("result", "hit")
                .description("Number of cache hits")
                .register(meterRegistry);
        this.missCounter = Counter.builder("cache.requests")
                .tag("result", "miss")
                .description("Number of cache misses")
                .register(meterRegistry);
    }

    /**
     * Cache-aside with stampede protection (single-flight lock) and jittered TTL.
     */
    public <T> T getOrCompute(String key, Class<T> clazz, Duration baseTtl, Supplier<T> loader) {
        return getOrCompute(key, objectMapper.constructType(clazz), baseTtl, loader);
    }

    public <T> java.util.List<T> getOrComputeList(String key, Class<T> elementClass, Duration baseTtl, Supplier<java.util.List<T>> loader) {
        JavaType listType = objectMapper.getTypeFactory().constructCollectionType(java.util.List.class, elementClass);
        return getOrCompute(key, listType, baseTtl, loader);
    }

    public <T> T getOrCompute(String key, JavaType javaType, Duration baseTtl, Supplier<T> loader) {
        // 1. Try reading from cache
        try {
            String cached = redisTemplate.opsForValue().get(key);
            if (cached != null) {
                hitCounter.increment();
                log.debug("Cache hit for key: {}", key);
                return objectMapper.readValue(cached, javaType);
            }
        } catch (Exception e) {
            log.warn("Redis read error on key {}: {}", key, e.getMessage());
        }

        missCounter.increment();
        log.debug("Cache miss for key: {}", key);

        // 2. Stampede protection: acquire distributed lock
        String lockKey = "lock:" + key;
        boolean acquired = false;
        try {
            Boolean lockAcquired = redisTemplate.opsForValue().setIfAbsent(lockKey, "locked", Duration.ofSeconds(5));
            acquired = Boolean.TRUE.equals(lockAcquired);
        } catch (Exception e) {
            log.warn("Failed acquiring cache lock for key {}: {}", key, e.getMessage());
        }

        if (!acquired) {
            // Another thread is loading; wait briefly and retry cache read once
            try {
                Thread.sleep(60);
                String retryCached = redisTemplate.opsForValue().get(key);
                if (retryCached != null) {
                    hitCounter.increment();
                    return objectMapper.readValue(retryCached, javaType);
                }
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
            } catch (Exception ignored) {
            }
        }

        try {
            // 3. Compute value from DB loader
            T value = loader.get();
            if (value != null) {
                put(key, value, baseTtl);
            }
            return value;
        } finally {
            if (acquired) {
                try {
                    redisTemplate.delete(lockKey);
                } catch (Exception ignored) {
                }
            }
        }
    }

    public void put(String key, Object value, Duration baseTtl) {
        try {
            String json = objectMapper.writeValueAsString(value);
            // Apply 5-15% jitter to TTL to prevent simultaneous cache expiration storms
            long jitterSeconds = ThreadLocalRandom.current().nextLong(1, Math.max(2, baseTtl.toSeconds() / 10));
            Duration ttlWithJitter = baseTtl.plusSeconds(jitterSeconds);
            redisTemplate.opsForValue().set(key, json, ttlWithJitter);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize cache entry for key {}: {}", key, e.getMessage());
        } catch (Exception e) {
            log.warn("Failed to write to Redis for key {}: {}", key, e.getMessage());
        }
    }

    public void evict(String key) {
        try {
            redisTemplate.delete(key);
            log.debug("Evicted cache key: {}", key);
        } catch (Exception e) {
            log.warn("Failed to evict cache key {}: {}", key, e.getMessage());
        }
    }

    /**
     * Evict after transaction commit (SYSTEM_DESIGN.md section 8) to prevent stale reads.
     */
    public void evictAfterCommit(String key) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    evict(key);
                }
            });
        } else {
            evict(key);
        }
    }
}
