package com.unipulse.core.department.repo;

import com.unipulse.core.department.domain.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, UUID> {
    Optional<Department> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
}
