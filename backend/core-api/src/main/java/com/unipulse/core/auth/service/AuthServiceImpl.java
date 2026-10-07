package com.unipulse.core.auth.service;

import com.unipulse.common.error.ApiException;
import com.unipulse.common.error.ErrorCodes;
import com.unipulse.common.model.UserRole;
import com.unipulse.core.auth.api.AuthDtos;
import com.unipulse.core.user.api.UserDto;
import com.unipulse.core.user.domain.User;
import com.unipulse.core.user.repo.UserRepository;
import com.unipulse.core.user.service.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;
    private final LoginRateLimiter loginRateLimiter;

    @Override
    @Transactional
    public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest request) {
        String normalizedEmail = request.email().toLowerCase().trim();

        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw ApiException.conflict("EMAIL_ALREADY_EXISTS", "A user with this email address already exists.");
        }

        UserRole role = request.role() != null ? request.role() : UserRole.REQUESTER;

        User user = User.builder()
                .id(UUID.randomUUID())
                .campusId((short) 1)
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.password()))
                .fullName(request.fullName().trim())
                .role(role)
                .departmentId(request.departmentId())
                .active(true)
                .build();

        User savedUser = userRepository.save(user);
        UserDto userDto = userMapper.toDto(savedUser);

        String accessToken = jwtTokenProvider.generateAccessToken(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getRole(),
                savedUser.getCampusId()
        );

        RefreshTokenService.TokenPair tokenPair = refreshTokenService.createRefreshToken(savedUser.getId());

        log.info("Registered new user with email: {} and role: {}", savedUser.getEmail(), savedUser.getRole());

        return AuthDtos.AuthResponse.of(
                accessToken,
                tokenPair.rawRefreshToken(),
                jwtTokenProvider.getAccessTokenExpirationSeconds(),
                userDto
        );
    }

    @Override
    @Transactional
    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request, String clientIp) {
        String normalizedEmail = request.email().toLowerCase().trim();

        // FR-AUTH-5: Login rate limit 5 attempts/min/IP+email
        loginRateLimiter.checkLimit(clientIp, normalizedEmail);

        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ApiException(401, ErrorCodes.INVALID_CREDENTIALS, "Invalid email or password."));

        if (!user.isActive()) {
            throw ApiException.forbidden("Your account has been deactivated.");
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException(401, ErrorCodes.INVALID_CREDENTIALS, "Invalid email or password.");
        }

        // Reset rate limiter on successful authentication
        loginRateLimiter.resetLimit(clientIp, normalizedEmail);

        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId(),
                user.getEmail(),
                user.getRole(),
                user.getCampusId()
        );

        RefreshTokenService.TokenPair tokenPair = refreshTokenService.createRefreshToken(user.getId());
        UserDto userDto = userMapper.toDto(user);

        log.info("User logged in successfully: {}", user.getEmail());

        return AuthDtos.AuthResponse.of(
                accessToken,
                tokenPair.rawRefreshToken(),
                jwtTokenProvider.getAccessTokenExpirationSeconds(),
                userDto
        );
    }

    @Override
    @Transactional(noRollbackFor = ApiException.class)
    public AuthDtos.AuthResponse refresh(String refreshToken) {
        RefreshTokenService.TokenPair tokenPair = refreshTokenService.rotateRefreshToken(refreshToken);

        User user = userRepository.findById(tokenPair.entity().getUserId())
                .orElseThrow(() -> ApiException.notFound("User not found for refresh token"));

        if (!user.isActive()) {
            throw ApiException.forbidden("Your account has been deactivated.");
        }

        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId(),
                user.getEmail(),
                user.getRole(),
                user.getCampusId()
        );

        UserDto userDto = userMapper.toDto(user);

        return AuthDtos.AuthResponse.of(
                accessToken,
                tokenPair.rawRefreshToken(),
                jwtTokenProvider.getAccessTokenExpirationSeconds(),
                userDto
        );
    }

    @Override
    @Transactional
    public void logout(String bearerToken, String refreshToken) {
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            String token = bearerToken.substring(7);
            jwtTokenProvider.blacklistToken(token);
        }

        if (refreshToken != null && !refreshToken.isBlank()) {
            refreshTokenService.revokeToken(refreshToken);
        }
    }
}
