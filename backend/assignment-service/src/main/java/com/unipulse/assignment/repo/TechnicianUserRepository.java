package com.unipulse.assignment.repo;

import com.unipulse.assignment.domain.TechnicianUserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TechnicianUserRepository extends JpaRepository<TechnicianUserEntity, UUID> {
    List<TechnicianUserEntity> findByDepartmentIdAndActiveTrue(UUID departmentId);
}
