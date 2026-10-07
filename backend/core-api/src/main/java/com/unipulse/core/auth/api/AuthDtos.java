package com.unipulse.core.auth.api;

import com.unipulse.common.model.UserRole;
import com.unipulse.core.user.api.UserDto;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public final class AuthDtos {
    private AuthDtos() {}

    public record RegisterRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Email must be valid")
            String email,

            @NotBlank(message = "Password is required")
            @Size(min = 8, message = "Password must be at least 8 characters")
            String password,

            @NotBlank(message = "Full name is required")
            String fullName,

            UserRole role,

            UUID departmentId
    ) {}

    public record LoginRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Email must be valid")
            String email,

            @NotBlank(message = "Password is required")
            String password
    ) {}

    public record RefreshRequest(
            @NotBlank(message = "Refresh token is required")
            String refreshToken
    ) {}

    public record AuthResponse(
            String accessToken,
            String refreshToken,
            String tokenType,
            long expiresIn,
            UserDto user
    ) {
        public static AuthResponse of(String accessToken, String refreshToken, long expiresIn, UserDto user) {
            return new AuthResponse(accessToken, refreshToken, "Bearer", expiresIn, user);
        }
    }
}
