package com.unipulse.core.department.api;

import com.unipulse.core.department.service.DepartmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Departments & Categories", description = "Reference data APIs for campus departments, categories, and SLAs")
public class DepartmentController {

    private final DepartmentService departmentService;

    @GetMapping("/departments")
    @Operation(summary = "List all departments")
    public ResponseEntity<List<DepartmentDtos.DepartmentResponse>> getDepartments() {
        return ResponseEntity.ok(departmentService.getAllDepartments());
    }

    @GetMapping("/departments/{id}")
    @Operation(summary = "Get department by ID")
    public ResponseEntity<DepartmentDtos.DepartmentResponse> getDepartmentById(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(departmentService.getDepartmentById(id));
    }

    @PostMapping("/departments")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create department (ADMIN only)")
    public ResponseEntity<DepartmentDtos.DepartmentResponse> createDepartment(
            @Valid @RequestBody DepartmentDtos.CreateDepartmentRequest request) {
        DepartmentDtos.DepartmentResponse response = departmentService.createDepartment(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/categories")
    @Operation(summary = "List categories, optionally filtered by department ID")
    public ResponseEntity<List<DepartmentDtos.CategoryResponse>> getCategories(
            @RequestParam(value = "departmentId", required = false) UUID departmentId) {
        return ResponseEntity.ok(departmentService.getCategories(departmentId));
    }

    @GetMapping("/categories/{id}")
    @Operation(summary = "Get category by ID")
    public ResponseEntity<DepartmentDtos.CategoryResponse> getCategoryById(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(departmentService.getCategoryById(id));
    }

    @PostMapping("/categories")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEPT_HEAD')")
    @Operation(summary = "Create category (ADMIN or DEPT_HEAD)")
    public ResponseEntity<DepartmentDtos.CategoryResponse> createCategory(
            @Valid @RequestBody DepartmentDtos.CreateCategoryRequest request) {
        DepartmentDtos.CategoryResponse response = departmentService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/sla-policies")
    @Operation(summary = "List SLA policies")
    public ResponseEntity<List<DepartmentDtos.SlaPolicyResponse>> getSlaPolicies() {
        return ResponseEntity.ok(departmentService.getAllSlaPolicies());
    }

    @GetMapping("/technicians/{userId}/profile")
    @Operation(summary = "Get technician profile")
    public ResponseEntity<DepartmentDtos.TechnicianProfileResponse> getTechnicianProfile(@PathVariable("userId") UUID userId) {
        return ResponseEntity.ok(departmentService.getTechnicianProfile(userId));
    }

    @PutMapping("/technicians/{userId}/profile")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEPT_HEAD', 'TECHNICIAN')")
    @Operation(summary = "Upsert technician profile")
    public ResponseEntity<DepartmentDtos.TechnicianProfileResponse> upsertTechnicianProfile(
            @PathVariable("userId") UUID userId,
            @Valid @RequestBody DepartmentDtos.UpsertTechnicianProfileRequest request) {
        return ResponseEntity.ok(departmentService.upsertTechnicianProfile(userId, request));
    }
}
