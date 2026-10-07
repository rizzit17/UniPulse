package com.unipulse.core.department.service;

import com.unipulse.common.error.ApiException;
import com.unipulse.common.model.RequestPriority;
import com.unipulse.core.department.api.DepartmentDtos;
import com.unipulse.core.department.domain.Category;
import com.unipulse.core.department.domain.Department;
import com.unipulse.core.department.domain.TechnicianProfile;
import com.unipulse.core.department.repo.CategoryRepository;
import com.unipulse.core.department.repo.DepartmentRepository;
import com.unipulse.core.department.repo.SlaPolicyRepository;
import com.unipulse.core.department.repo.TechnicianProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final CategoryRepository categoryRepository;
    private final SlaPolicyRepository slaPolicyRepository;
    private final TechnicianProfileRepository technicianProfileRepository;
    private final DepartmentMapper departmentMapper;
    private final com.unipulse.core.shared.cache.RedisCacheService cacheService;

    @Override
    @Transactional(readOnly = true)
    public List<DepartmentDtos.DepartmentResponse> getAllDepartments() {
        return cacheService.getOrComputeList("dept:all", DepartmentDtos.DepartmentResponse.class, java.time.Duration.ofMinutes(10), () ->
                departmentRepository.findAll().stream()
                        .map(departmentMapper::toDto)
                        .toList()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public DepartmentDtos.DepartmentResponse getDepartmentById(UUID id) {
        return departmentRepository.findById(id)
                .map(departmentMapper::toDto)
                .orElseThrow(() -> ApiException.notFound("Department not found with id: " + id));
    }

    @Override
    @Transactional
    public DepartmentDtos.DepartmentResponse createDepartment(DepartmentDtos.CreateDepartmentRequest request) {
        String trimmedName = request.name().trim();
        if (departmentRepository.existsByNameIgnoreCase(trimmedName)) {
            throw ApiException.conflict("Department already exists with name: " + trimmedName);
        }

        Department department = Department.builder()
                .id(UUID.randomUUID())
                .name(trimmedName)
                .headUserId(request.headUserId())
                .build();

        Department saved = departmentRepository.save(department);
        cacheService.evictAfterCommit("dept:all");
        log.info("Created department: {} ({})", saved.getName(), saved.getId());
        return departmentMapper.toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DepartmentDtos.CategoryResponse> getCategories(UUID departmentId) {
        String cacheKey = (departmentId != null) ? "cat:dept:" + departmentId : "cat:all";
        return cacheService.getOrComputeList(cacheKey, DepartmentDtos.CategoryResponse.class, java.time.Duration.ofMinutes(10), () -> {
            List<Category> categories = (departmentId != null)
                    ? categoryRepository.findByDepartmentId(departmentId)
                    : categoryRepository.findAll();

            return categories.stream()
                    .map(departmentMapper::toDto)
                    .toList();
        });
    }

    @Override
    @Transactional(readOnly = true)
    public DepartmentDtos.CategoryResponse getCategoryById(UUID id) {
        return categoryRepository.findById(id)
                .map(departmentMapper::toDto)
                .orElseThrow(() -> ApiException.notFound("Category not found with id: " + id));
    }

    @Override
    @Transactional
    public DepartmentDtos.CategoryResponse createCategory(DepartmentDtos.CreateCategoryRequest request) {
        String trimmedName = request.name().trim();
        if (categoryRepository.existsByNameIgnoreCase(trimmedName)) {
            throw ApiException.conflict("Category already exists with name: " + trimmedName);
        }

        if (!departmentRepository.existsById(request.departmentId())) {
            throw ApiException.badRequest("Department does not exist with id: " + request.departmentId());
        }

        Category category = Category.builder()
                .id(UUID.randomUUID())
                .name(trimmedName)
                .departmentId(request.departmentId())
                .defaultPriority(request.defaultPriority())
                .build();

        Category saved = categoryRepository.save(category);
        cacheService.evictAfterCommit("cat:all");
        cacheService.evictAfterCommit("cat:dept:" + request.departmentId());
        log.info("Created category: {} ({}) for department: {}", saved.getName(), saved.getId(), saved.getDepartmentId());
        return departmentMapper.toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DepartmentDtos.SlaPolicyResponse> getAllSlaPolicies() {
        return cacheService.getOrComputeList("sla:policy:all", DepartmentDtos.SlaPolicyResponse.class, java.time.Duration.ofHours(1), () ->
                slaPolicyRepository.findAll().stream()
                        .map(departmentMapper::toDto)
                        .toList()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public DepartmentDtos.SlaPolicyResponse getSlaPolicy(RequestPriority priority) {
        return cacheService.getOrCompute("sla:policy:" + priority, DepartmentDtos.SlaPolicyResponse.class, java.time.Duration.ofHours(1), () ->
                slaPolicyRepository.findById(priority)
                        .map(departmentMapper::toDto)
                        .orElseThrow(() -> ApiException.notFound("SLA policy not found for priority: " + priority))
        );
    }

    @Override
    @Transactional(readOnly = true)
    public DepartmentDtos.TechnicianProfileResponse getTechnicianProfile(UUID userId) {
        return technicianProfileRepository.findById(userId)
                .map(departmentMapper::toDto)
                .orElseThrow(() -> ApiException.notFound("Technician profile not found for user: " + userId));
    }

    @Override
    @Transactional
    public DepartmentDtos.TechnicianProfileResponse upsertTechnicianProfile(
            UUID userId,
            DepartmentDtos.UpsertTechnicianProfileRequest request) {

        org.springframework.security.core.Authentication auth =
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.unipulse.core.auth.service.UserPrincipal principal) {
            if (principal.getRole() == com.unipulse.common.model.UserRole.TECHNICIAN && !principal.getId().equals(userId)) {
                throw ApiException.forbidden("Technicians may only update their own profile.");
            }
        }

        TechnicianProfile profile = technicianProfileRepository.findById(userId)
                .orElseGet(() -> TechnicianProfile.builder()
                        .userId(userId)
                        .skills(new ArrayList<>())
                        .build());

        if (request.skills() != null) {
            profile.setSkills(new ArrayList<>(request.skills()));
        }
        if (request.shiftStart() != null) {
            profile.setShiftStart(request.shiftStart());
        }
        if (request.shiftEnd() != null) {
            profile.setShiftEnd(request.shiftEnd());
        }
        if (request.maxActive() != null) {
            profile.setMaxActive(request.maxActive());
        }

        TechnicianProfile saved = technicianProfileRepository.save(profile);
        log.info("Upserted technician profile for user: {}", userId);
        return departmentMapper.toDto(saved);
    }
}
