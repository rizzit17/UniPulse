package com.unipulse.core.auth.service;

import com.unipulse.common.model.UserRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Slf4j
@Component
public class JwtTokenProvider {

    private final SecretKey key;
    private final long accessTokenExpirationSeconds;
    private final StringRedisTemplate redisTemplate;

    public JwtTokenProvider(
            @Value("${unipulse.jwt.secret:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}") String secret,
            @Value("${unipulse.jwt.access-token-expiration-seconds:900}") long accessTokenExpirationSeconds,
            StringRedisTemplate redisTemplate
    ) {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        this.key = Keys.hmacShaKeyFor(keyBytes);
        this.accessTokenExpirationSeconds = accessTokenExpirationSeconds;
        this.redisTemplate = redisTemplate;
    }

    public String generateAccessToken(UUID userId, String email, UserRole role, short campusId) {
        Instant now = Instant.now();
        Instant expiry = now.plusSeconds(accessTokenExpirationSeconds);
        String jti = UUID.randomUUID().toString();

        return Jwts.builder()
                .subject(email)
                .claim("userId", userId.toString())
                .claim("role", role.name())
                .claim("campusId", campusId)
                .id(jti)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(key)
                .compact();
    }

    public Claims parseAndValidateClaims(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        String jti = claims.getId();
        if (jti != null && isBlacklisted(jti)) {
            throw new JwtException("Token has been revoked/blacklisted");
        }

        return claims;
    }

    public boolean validateToken(String token) {
        try {
            parseAndValidateClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Invalid JWT token: {}", e.getMessage());
            return false;
        }
    }

    public void blacklistToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            String jti = claims.getId();
            Date expiration = claims.getExpiration();
            if (jti != null && expiration != null) {
                long remainingMillis = expiration.getTime() - System.currentTimeMillis();
                if (remainingMillis > 0) {
                    String redisKey = "jwt:bl:" + jti;
                    redisTemplate.opsForValue().set(redisKey, "revoked", Duration.ofMillis(remainingMillis));
                    log.info("Blacklisted token jti: {} for {} ms", jti, remainingMillis);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to blacklist token: {}", e.getMessage());
        }
    }

    public boolean isBlacklisted(String jti) {
        try {
            Boolean hasKey = redisTemplate.hasKey("jwt:bl:" + jti);
            return Boolean.TRUE.equals(hasKey);
        } catch (Exception e) {
            log.warn("Redis unreachable when checking JWT blacklist: {}", e.getMessage());
            return false;
        }
    }

    public long getAccessTokenExpirationSeconds() {
        return accessTokenExpirationSeconds;
    }
}
