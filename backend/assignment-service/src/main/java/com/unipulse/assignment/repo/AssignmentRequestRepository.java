package com.unipulse.assignment.repo;

import com.unipulse.assignment.domain.ServiceRequestForAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.UUID;

@Repository
public interface AssignmentRequestRepository extends JpaRepository<ServiceRequestForAssignment, UUID> {

    @Modifying
    @Query("UPDATE ServiceRequestForAssignment sr " +
           "SET sr.assigneeId = :assigneeId, " +
           "    sr.status = com.unipulse.common.model.RequestStatus.ASSIGNED, " +
           "    sr.version = sr.version + 1, " +
           "    sr.updatedAt = :now " +
           "WHERE sr.id = :requestId " +
           "  AND sr.status = com.unipulse.common.model.RequestStatus.OPEN " +
           "  AND sr.assigneeId IS NULL")
    int assignTechnician(@Param("requestId") UUID requestId,
                         @Param("assigneeId") UUID assigneeId,
                         @Param("now") Instant now);
}
