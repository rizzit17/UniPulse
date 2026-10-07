package com.unipulse.core.user.service;

import com.unipulse.common.error.ApiException;
import com.unipulse.common.model.UserRole;
import com.unipulse.core.user.api.UserDto;
import com.unipulse.core.user.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Override
    public UserDto getById(UUID id) {
        return userRepository.findById(id)
                .map(userMapper::toDto)
                .orElseThrow(() -> ApiException.notFound("User not found with id: " + id));
    }

    @Override
    public Optional<UserDto> findByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .map(userMapper::toDto);
    }

    @Override
    public List<UserDto> findTechniciansByDepartment(UUID departmentId) {
        return userRepository.findByDepartmentIdAndRole(departmentId, UserRole.TECHNICIAN).stream()
                .map(userMapper::toDto)
                .toList();
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmailIgnoreCase(email);
    }
}
