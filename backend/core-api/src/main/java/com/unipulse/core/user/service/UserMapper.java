package com.unipulse.core.user.service;

import com.unipulse.core.user.api.UserDto;
import com.unipulse.core.user.domain.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserDto toDto(User user) {
        if (user == null) {
            return null;
        }
        return new UserDto(
                user.getId(),
                user.getCampusId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.getDepartmentId(),
                user.isActive(),
                user.getCreatedAt()
        );
    }
}
