package com.unipulse.core.user.api;

import com.unipulse.common.model.UserRole;

import java.time.Instant;
import java.util.UUID;

public record UserDto(
        UUID id,
        short campusId,
        String email,
        String fullName,
        UserRole role,
        UUID departmentId,
        boolean active,
        Instant createdAt
) {}
