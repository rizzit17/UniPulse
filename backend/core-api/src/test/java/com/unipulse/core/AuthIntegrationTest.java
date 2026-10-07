package com.unipulse.core;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.unipulse.common.error.ErrorCodes;
import com.unipulse.common.model.UserRole;
import com.unipulse.core.auth.api.AuthDtos;
import com.unipulse.core.user.domain.User;
import com.unipulse.core.user.repo.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private StringRedisTemplate redisTemplate;

    @BeforeEach
    void setup() {
        userRepository.deleteAll();
        try {
            // Flush rate limit and blacklist keys
            var keys = redisTemplate.keys("rl:login:*");
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
            }
            var blKeys = redisTemplate.keys("jwt:bl:*");
            if (blKeys != null && !blKeys.isEmpty()) {
                redisTemplate.delete(blKeys);
            }
        } catch (Exception ignored) {}
    }

    @Test
    @DisplayName("FR-AUTH-1: Register user with email and password (BCrypt cost 12)")
    void shouldRegisterNewUser() throws Exception {
        AuthDtos.RegisterRequest request = new AuthDtos.RegisterRequest(
                "student1@unipulse.edu",
                "Password123!",
                "Aarav Sharma",
                UserRole.REQUESTER,
                null
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("student1@unipulse.edu"))
                .andExpect(jsonPath("$.user.role").value("REQUESTER"));

        User saved = userRepository.findByEmailIgnoreCase("student1@unipulse.edu").orElseThrow();
        assertThat(passwordEncoder.matches("Password123!", saved.getPasswordHash())).isTrue();
    }

    @Test
    @DisplayName("FR-AUTH-2: Login returns JWT access token and rotating refresh token")
    void shouldLoginSuccessfully() throws Exception {
        // Register user first
        AuthDtos.RegisterRequest registerRequest = new AuthDtos.RegisterRequest(
                "tech1@unipulse.edu",
                "SecurePass123",
                "Rahul Verma",
                UserRole.TECHNICIAN,
                null
        );
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated());

        // Login
        AuthDtos.LoginRequest loginRequest = new AuthDtos.LoginRequest("tech1@unipulse.edu", "SecurePass123");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.user.role").value("TECHNICIAN"));
    }

    @Test
    @DisplayName("FR-AUTH-2 & FR-AUTH-3: Refresh token rotation and reuse detection")
    void shouldRotateRefreshTokenAndDetectReuse() throws Exception {
        // 1. Register
        AuthDtos.RegisterRequest regReq = new AuthDtos.RegisterRequest(
                "rotator@unipulse.edu",
                "Secret999!",
                "Rohan Das",
                UserRole.REQUESTER,
                null
        );
        MvcResult regResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regReq)))
                .andExpect(status().isCreated())
                .andReturn();

        AuthDtos.AuthResponse regResponse = objectMapper.readValue(
                regResult.getResponse().getContentAsString(),
                AuthDtos.AuthResponse.class
        );
        String initialRefreshToken = regResponse.refreshToken();

        // 2. Rotate token once
        AuthDtos.RefreshRequest refreshReq1 = new AuthDtos.RefreshRequest(initialRefreshToken);
        MvcResult refreshResult1 = mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshReq1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andReturn();

        AuthDtos.AuthResponse refreshResponse1 = objectMapper.readValue(
                refreshResult1.getResponse().getContentAsString(),
                AuthDtos.AuthResponse.class
        );
        String rotatedRefreshToken = refreshResponse1.refreshToken();
        assertThat(rotatedRefreshToken).isNotEqualTo(initialRefreshToken);

        // 3. REUSE DETECTION (FR-AUTH-3): replay initialRefreshToken (which was already rotated)
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AuthDtos.RefreshRequest(initialRefreshToken))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(ErrorCodes.REFRESH_TOKEN_REUSE));

        // 4. Verify that the whole family was revoked (even the rotatedRefreshToken is now revoked)
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AuthDtos.RefreshRequest(rotatedRefreshToken))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("FR-AUTH-4: Authenticated /me endpoint returns profile with valid Bearer token")
    void shouldAccessMeEndpointWithBearerToken() throws Exception {
        AuthDtos.RegisterRequest regReq = new AuthDtos.RegisterRequest(
                "me@unipulse.edu",
                "Secret999!",
                "Priya Patel",
                UserRole.DEPT_HEAD,
                null
        );
        MvcResult regResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regReq)))
                .andExpect(status().isCreated())
                .andReturn();

        AuthDtos.AuthResponse regResponse = objectMapper.readValue(
                regResult.getResponse().getContentAsString(),
                AuthDtos.AuthResponse.class
        );

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + regResponse.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("me@unipulse.edu"))
                .andExpect(jsonPath("$.fullName").value("Priya Patel"))
                .andExpect(jsonPath("$.role").value("DEPT_HEAD"));
    }

    @Test
    @DisplayName("FR-AUTH-6: Logout blacklists access token in Redis")
    void shouldBlacklistAccessTokenOnLogout() throws Exception {
        AuthDtos.RegisterRequest regReq = new AuthDtos.RegisterRequest(
                "logout@unipulse.edu",
                "Secret999!",
                "Ananya Roy",
                UserRole.REQUESTER,
                null
        );
        MvcResult regResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regReq)))
                .andExpect(status().isCreated())
                .andReturn();

        AuthDtos.AuthResponse regResponse = objectMapper.readValue(
                regResult.getResponse().getContentAsString(),
                AuthDtos.AuthResponse.class
        );

        // Call /me before logout - OK
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + regResponse.accessToken()))
                .andExpect(status().isOk());

        // Logout
        mockMvc.perform(post("/api/v1/auth/logout")
                        .header("Authorization", "Bearer " + regResponse.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AuthDtos.RefreshRequest(regResponse.refreshToken()))))
                .andExpect(status().isOk());

        // Call /me after logout - 401 Unauthorized because jti is blacklisted!
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + regResponse.accessToken()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("FR-AUTH-5: Rate limit blocks after 5 failed login attempts in 1 min")
    void shouldEnforceLoginRateLimit() throws Exception {
        String testEmail = "victim@unipulse.edu";
        AuthDtos.LoginRequest badLogin = new AuthDtos.LoginRequest(testEmail, "WrongPassword");

        // 5 bad attempts
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(badLogin)))
                    .andExpect(status().isUnauthorized());
        }

        // 6th attempt should be blocked with 429 RATE_LIMIT_EXCEEDED
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badLogin)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value(ErrorCodes.RATE_LIMIT_EXCEEDED));
    }
}
