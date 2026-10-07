package com.unipulse.core.auth.service;

import com.unipulse.common.error.ApiException;
import com.unipulse.common.error.ErrorCodes;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Enforces FR-AUTH-5: Login rate limit of 5 attempts/min per IP + email in Redis.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LoginRateLimiter {

    private static final int MAX_ATTEMPTS = 5;
    private static final Duration WINDOW = Duration.ofMinutes(1);

    private final StringRedisTemplate redisTemplate;

    public void checkLimit(String clientIp, String email) {
        String key = "rl:login:" + clientIp + ":" + email.toLowerCase().trim();
        try {
            Long count = redisTemplate.opsForValue().increment(key);
            if (count != null && count == 1) {
                redisTemplate.expire(key, WINDOW);
            }
            if (count != null && count > MAX_ATTEMPTS) {
                log.warn("Login rate limit exceeded for key: {} (attempts: {})", key, count);
                throw new ApiException(429, ErrorCodes.RATE_LIMIT_EXCEEDED,
                        "Too many login attempts. Please wait 1 minute before trying again.");
            }
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Redis unavailable during login rate check; failing closed for login: {}", e.getMessage());
            // Per SYSTEM_DESIGN.md section 13: "Redis down: rate limiter fails open for reads, closed for login"
            throw new ApiException(429, ErrorCodes.RATE_LIMIT_EXCEEDED,
                    "Login temporarily restricted due to security service unavailability. Please try again shortly.");
        }
    }

    public void resetLimit(String clientIp, String email) {
        String key = "rl:login:" + clientIp + ":" + email.toLowerCase().trim();
        try {
            redisTemplate.delete(key);
        } catch (Exception e) {
            log.warn("Failed to clear login rate limit for key {}: {}", key, e.getMessage());
        }
    }
}
