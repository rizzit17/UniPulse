package com.unipulse.core.user.service;

import com.unipulse.core.user.api.UserDto;
import com.unipulse.core.user.domain.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {
    UserDto toDto(User user);
}
