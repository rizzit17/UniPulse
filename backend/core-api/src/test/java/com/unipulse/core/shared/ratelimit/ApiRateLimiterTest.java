package com.unipulse.core.shared.ratelimit;

import com.unipulse.common.error.ApiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Duration;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApiRateLimiterTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ZSetOperations<String, String> zSetOperations;

    private ApiRateLimiter rateLimiter;
    private final UUID userId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        when(redisTemplate.opsForZSet()).thenReturn(zSetOperations);
        rateLimiter = new ApiRateLimiter(redisTemplate);
        ReflectionTestUtils.setField(rateLimiter, "maxRequestsPerMinute", 5);
    }

    @Test
    @DisplayName("Allows request when user is within rate limit window")
    void shouldAllowRequestWithinLimit() {
        when(zSetOperations.zCard("rl:api:" + userId)).thenReturn(3L);

        assertThatCode(() -> rateLimiter.checkLimit(userId))
                .doesNotThrowAnyException();

        verify(zSetOperations).removeRangeByScore(eq("rl:api:" + userId), eq(0.0), anyDouble());
        verify(zSetOperations).add(eq("rl:api:" + userId), anyString(), anyDouble());
        verify(redisTemplate).expire(eq("rl:api:" + userId), any(Duration.class));
    }

    @Test
    @DisplayName("Throws 429 when user exceeds rate limit")
    void shouldThrowWhenLimitExceeded() {
        when(zSetOperations.zCard("rl:api:" + userId)).thenReturn(5L);

        assertThatThrownBy(() -> rateLimiter.checkLimit(userId))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("rate limit exceeded");

        verify(zSetOperations, never()).add(anyString(), anyString(), anyDouble());
    }

    @Test
    @DisplayName("Fails open when Redis encounters an exception")
    void shouldFailOpenOnRedisError() {
        when(zSetOperations.removeRangeByScore(anyString(), anyDouble(), anyDouble()))
                .thenThrow(new RuntimeException("Redis connection timeout"));

        assertThatCode(() -> rateLimiter.checkLimit(userId))
                .doesNotThrowAnyException();
    }
}
