package com.unipulse.core.department.service;

import com.unipulse.core.department.api.DepartmentDtos;
import com.unipulse.core.department.domain.Category;
import com.unipulse.core.department.domain.Department;
import com.unipulse.core.department.domain.SlaPolicy;
import com.unipulse.core.department.domain.TechnicianProfile;
import org.springframework.stereotype.Component;

import java.util.ArrayList;

@Component
public class DepartmentMapper {

    public DepartmentDtos.DepartmentResponse toDto(Department department) {
        if (department == null) {
            return null;
        }
        return new DepartmentDtos.DepartmentResponse(
                department.getId(),
                department.getName(),
                department.getHeadUserId()
        );
    }

    public DepartmentDtos.CategoryResponse toDto(Category category) {
        if (category == null) {
            return null;
        }
        return new DepartmentDtos.CategoryResponse(
                category.getId(),
                category.getName(),
                category.getDepartmentId(),
                category.getDefaultPriority()
        );
    }

    public DepartmentDtos.SlaPolicyResponse toDto(SlaPolicy slaPolicy) {
        if (slaPolicy == null) {
            return null;
        }
        return new DepartmentDtos.SlaPolicyResponse(
                slaPolicy.getPriority(),
                slaPolicy.getRespondMinutes(),
                slaPolicy.getResolveMinutes()
        );
    }

    public DepartmentDtos.TechnicianProfileResponse toDto(TechnicianProfile profile) {
        if (profile == null) {
            return null;
        }
        return new DepartmentDtos.TechnicianProfileResponse(
                profile.getUserId(),
                profile.getSkills() != null ? new ArrayList<>(profile.getSkills()) : null,
                profile.getShiftStart(),
                profile.getShiftEnd(),
                profile.getMaxActive()
        );
    }
}
