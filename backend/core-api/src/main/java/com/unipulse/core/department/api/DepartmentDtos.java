package com.unipulse.core.department.api;

import com.unipulse.common.model.RequestPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public final class DepartmentDtos {

    private DepartmentDtos() {}

    public record DepartmentResponse(
            UUID id,
            String name,
            UUID headUserId
    ) {}

    public record CreateDepartmentRequest(
            @NotBlank(message = "Department name is required")
            String name,
            UUID headUserId
    ) {}

    public record CategoryResponse(
            UUID id,
            String name,
            UUID departmentId,
            RequestPriority defaultPriority
    ) {}

    public record CreateCategoryRequest(
            @NotBlank(message = "Category name is required")
            String name,
            @NotNull(message = "Department ID is required")
            UUID departmentId,
            @NotNull(message = "Default priority is required")
            RequestPriority defaultPriority
    ) {}

    public record SlaPolicyResponse(
            RequestPriority priority,
            int respondMinutes,
            int resolveMinutes
    ) {}

    public record TechnicianProfileResponse(
            UUID userId,
            List<String> skills,
            LocalTime shiftStart,
            LocalTime shiftEnd,
            int maxActive
    ) {}

    public record UpsertTechnicianProfileRequest(
            List<String> skills,
            LocalTime shiftStart,
            LocalTime shiftEnd,
            Integer maxActive
    ) {}
}
