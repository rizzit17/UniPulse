package com.unipulse.assignment.repo;

import com.unipulse.assignment.domain.TechnicianCandidateEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TechnicianCandidateRepository extends JpaRepository<TechnicianCandidateEntity, UUID> {

    @Query("SELECT tp FROM TechnicianCandidateEntity tp " +
           "WHERE tp.userId IN (SELECT u.id FROM TechnicianUserEntity u WHERE u.departmentId = :deptId AND u.active = true)")
    List<TechnicianCandidateEntity> findActiveTechniciansInDepartment(@Param("deptId") UUID deptId);
}
