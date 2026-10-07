package com.unipulse.core.shared.cache;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RedisCacheServiceTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    private RedisCacheService cacheService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        cacheService = new RedisCacheService(redisTemplate, objectMapper, new SimpleMeterRegistry());
    }

    @Test
    @DisplayName("Returns cached value on hit without calling loader")
    void shouldReturnCachedValueOnHit() {
        when(valueOperations.get("test:key")).thenReturn("\"cached-value\"");

        AtomicInteger loaderCalls = new AtomicInteger(0);
        String result = cacheService.getOrCompute("test:key", String.class, Duration.ofMinutes(5), () -> {
            loaderCalls.incrementAndGet();
            return "computed-value";
        });

        assertThat(result).isEqualTo("cached-value");
        assertThat(loaderCalls.get()).isZero();
    }

    @Test
    @DisplayName("Computes and stores value in cache on miss")
    void shouldComputeAndStoreOnMiss() {
        when(valueOperations.get("test:key")).thenReturn(null);
        when(valueOperations.setIfAbsent(eq("lock:test:key"), eq("locked"), any(Duration.class))).thenReturn(true);

        AtomicInteger loaderCalls = new AtomicInteger(0);
        String result = cacheService.getOrCompute("test:key", String.class, Duration.ofMinutes(5), () -> {
            loaderCalls.incrementAndGet();
            return "computed-value";
        });

        assertThat(result).isEqualTo("computed-value");
        assertThat(loaderCalls.get()).isEqualTo(1);
        verify(valueOperations).set(eq("test:key"), eq("\"computed-value\""), any(Duration.class));
        verify(redisTemplate).delete("lock:test:key");
    }

    @Test
    @DisplayName("Evicts key from Redis")
    void shouldEvictKey() {
        cacheService.evict("test:key");
        verify(redisTemplate).delete("test:key");
    }
}
