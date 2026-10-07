package com.unipulse.core.department.service;

import com.unipulse.core.department.api.DepartmentDtos;
import com.unipulse.core.department.domain.Category;
import com.unipulse.core.department.domain.Department;
import com.unipulse.core.department.domain.SlaPolicy;
import com.unipulse.core.department.domain.TechnicianProfile;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface DepartmentMapper {
    DepartmentDtos.DepartmentResponse toDto(Department department);
    DepartmentDtos.CategoryResponse toDto(Category category);
    DepartmentDtos.SlaPolicyResponse toDto(SlaPolicy slaPolicy);
    DepartmentDtos.TechnicianProfileResponse toDto(TechnicianProfile profile);
}
