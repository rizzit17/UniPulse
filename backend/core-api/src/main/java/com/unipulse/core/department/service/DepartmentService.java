package com.unipulse.core.department.service;

import com.unipulse.common.model.RequestPriority;
import com.unipulse.core.department.api.DepartmentDtos;

import java.util.List;
import java.util.UUID;

public interface DepartmentService {
    List<DepartmentDtos.DepartmentResponse> getAllDepartments();
    DepartmentDtos.DepartmentResponse getDepartmentById(UUID id);
    DepartmentDtos.DepartmentResponse createDepartment(DepartmentDtos.CreateDepartmentRequest request);

    List<DepartmentDtos.CategoryResponse> getCategories(UUID departmentId);
    DepartmentDtos.CategoryResponse getCategoryById(UUID id);
    DepartmentDtos.CategoryResponse createCategory(DepartmentDtos.CreateCategoryRequest request);

    List<DepartmentDtos.SlaPolicyResponse> getAllSlaPolicies();
    DepartmentDtos.SlaPolicyResponse getSlaPolicy(RequestPriority priority);

    DepartmentDtos.TechnicianProfileResponse getTechnicianProfile(UUID userId);
    DepartmentDtos.TechnicianProfileResponse upsertTechnicianProfile(UUID userId, DepartmentDtos.UpsertTechnicianProfileRequest request);
}
