package com.unipulse.core.user.service;

import com.unipulse.core.user.api.UserDto;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserService {
    UserDto getById(UUID id);
    Optional<UserDto> findByEmail(String email);
    List<UserDto> findTechniciansByDepartment(UUID departmentId);
    boolean existsByEmail(String email);
}
