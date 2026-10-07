package com.unipulse.core.auth.service;

import com.unipulse.common.error.ApiException;
import com.unipulse.common.error.ErrorCodes;
import com.unipulse.core.auth.domain.RefreshToken;
import com.unipulse.core.auth.repo.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${unipulse.jwt.refresh-token-expiration-seconds:604800}")
    private long refreshTokenExpirationSeconds;

    public record TokenPair(String rawRefreshToken, RefreshToken entity) {}

    @Transactional
    public TokenPair createRefreshToken(UUID userId) {
        UUID familyId = UUID.randomUUID();
        String rawToken = generateSecureRandomToken();
        String tokenHash = hashToken(rawToken);

        RefreshToken refreshToken = RefreshToken.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .familyId(familyId)
                .tokenHash(tokenHash)
                .expiresAt(Instant.now().plusSeconds(refreshTokenExpirationSeconds))
                .revoked(false)
                .build();

        RefreshToken saved = refreshTokenRepository.save(refreshToken);
        return new TokenPair(rawToken, saved);
    }

    @Transactional(noRollbackFor = ApiException.class)
    public TokenPair rotateRefreshToken(String rawRefreshToken) {
        String tokenHash = hashToken(rawRefreshToken);

        RefreshToken current = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new ApiException(401, ErrorCodes.TOKEN_REVOKED, "Invalid refresh token"));

        // Reuse detection check (FR-AUTH-3)
        if (current.isRevoked() || current.getReplacedBy() != null) {
            log.warn("Refresh token reuse detected for user {} in family {}! Revoking family.",
                    current.getUserId(), current.getFamilyId());
            refreshTokenRepository.revokeFamily(current.getFamilyId());
            throw new ApiException(401, ErrorCodes.REFRESH_TOKEN_REUSE,
                    "Refresh token reuse detected. All active sessions in this family have been revoked.");
        }

        if (current.isExpired()) {
            current.setRevoked(true);
            refreshTokenRepository.save(current);
            throw new ApiException(401, ErrorCodes.TOKEN_EXPIRED, "Refresh token has expired");
        }

        // Generate next token in family
        String newRawToken = generateSecureRandomToken();
        String newTokenHash = hashToken(newRawToken);
        UUID newId = UUID.randomUUID();

        RefreshToken nextToken = RefreshToken.builder()
                .id(newId)
                .userId(current.getUserId())
                .familyId(current.getFamilyId())
                .tokenHash(newTokenHash)
                .expiresAt(Instant.now().plusSeconds(refreshTokenExpirationSeconds))
                .revoked(false)
                .build();

        current.setRevoked(true);
        current.setReplacedBy(newId);

        refreshTokenRepository.save(current);
        RefreshToken savedNext = refreshTokenRepository.save(nextToken);

        return new TokenPair(newRawToken, savedNext);
    }

    @Transactional
    public void revokeToken(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return;
        }
        String tokenHash = hashToken(rawRefreshToken);
        refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
        });
    }

    @Transactional
    public void revokeAllUserTokens(UUID userId) {
        refreshTokenRepository.revokeAllForUser(userId);
    }

    private String generateSecureRandomToken() {
        byte[] bytes = new byte[48];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }
}
