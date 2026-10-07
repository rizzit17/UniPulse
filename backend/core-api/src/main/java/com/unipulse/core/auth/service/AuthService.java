package com.unipulse.core.auth.service;

import com.unipulse.core.auth.api.AuthDtos;

public interface AuthService {
    AuthDtos.AuthResponse register(AuthDtos.RegisterRequest request);
    AuthDtos.AuthResponse login(AuthDtos.LoginRequest request, String clientIp);
    AuthDtos.AuthResponse refresh(String refreshToken);
    void logout(String bearerToken, String refreshToken);
}
