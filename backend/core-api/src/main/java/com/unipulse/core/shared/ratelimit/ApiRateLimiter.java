package com.unipulse.core.shared.ratelimit;

import com.unipulse.common.error.ApiException;
import com.unipulse.common.error.ErrorCodes;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class ApiRateLimiter {

    private final StringRedisTemplate redisTemplate;

    @Value("${unipulse.ratelimit.api.max-requests:120}")
    private int maxRequestsPerMinute;

    /**
     * Sliding window rate limiter for authenticated user API calls.
     * Fails open if Redis is temporarily unreachable.
     */
    public void checkLimit(UUID userId) {
        if (userId == null) {
            return;
        }

        String key = "rl:api:" + userId;
        long now = System.currentTimeMillis();
        long windowStart = now - 60_000L; // 60 seconds sliding window

        try {
            // 1. Remove expired entries older than 60s
            redisTemplate.opsForZSet().removeRangeByScore(key, 0, windowStart);

            // 2. Count current calls in the window
            Long count = redisTemplate.opsForZSet().zCard(key);
            if (count != null && count >= maxRequestsPerMinute) {
                log.warn("User {} exceeded API rate limit: {} requests in last 60s", userId, count);
                throw new ApiException(429, ErrorCodes.RATE_LIMIT_EXCEEDED,
                        "API rate limit exceeded (" + maxRequestsPerMinute + " req/min). Please try again shortly.");
            }

            // 3. Record this request with a unique member
            String member = now + ":" + UUID.randomUUID().toString().substring(0, 8);
            redisTemplate.opsForZSet().add(key, member, now);
            redisTemplate.expire(key, Duration.ofSeconds(65));
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            // Per SYSTEM_DESIGN.md section 13: rate limiter fails open for reads/API when Redis is down
            log.warn("Redis error during API rate check for user {}; failing open: {}", userId, e.getMessage());
        }
    }
}
