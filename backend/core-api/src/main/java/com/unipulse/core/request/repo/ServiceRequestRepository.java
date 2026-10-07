package com.unipulse.core.request.repo;

import com.unipulse.core.request.domain.ServiceRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, UUID>, JpaSpecificationExecutor<ServiceRequest> {

    Optional<ServiceRequest> findByPublicId(String publicId);

    @Query("""
        SELECT r FROM ServiceRequest r
        WHERE r.requesterId = :requesterId
          AND r.categoryId = :categoryId
          AND LOWER(r.locationBlock) = LOWER(:locationBlock)
          AND r.createdAt >= :since
        ORDER BY r.createdAt DESC
    """)
    List<ServiceRequest> findDuplicates(
            @Param("requesterId") UUID requesterId,
            @Param("categoryId") UUID categoryId,
            @Param("locationBlock") String locationBlock,
            @Param("since") Instant since
    );

    @Query(value = "SELECT nextval('request_public_id_seq')", nativeQuery = true)
    Long getNextPublicIdSequence();

    @Query("""
        SELECT r FROM ServiceRequest r
        WHERE r.status IN (com.unipulse.common.model.RequestStatus.OPEN,
                           com.unipulse.common.model.RequestStatus.ASSIGNED,
                           com.unipulse.common.model.RequestStatus.IN_PROGRESS)
          AND r.resolveBy < :now
          AND r.escalationLevel < :maxLevel
        ORDER BY r.resolveBy ASC
    """)
    List<ServiceRequest> findBreachedRequests(
            @Param("now") Instant now,
            @Param("maxLevel") short maxLevel,
            org.springframework.data.domain.Pageable pageable
    );

    @Query("""
        SELECT r FROM ServiceRequest r
        WHERE r.status IN (com.unipulse.common.model.RequestStatus.OPEN,
                           com.unipulse.common.model.RequestStatus.ASSIGNED,
                           com.unipulse.common.model.RequestStatus.IN_PROGRESS)
          AND r.resolveBy >= :now
          AND r.resolveBy <= :warningThreshold
          AND r.escalationLevel = 0
        ORDER BY r.resolveBy ASC
    """)
    List<ServiceRequest> findWarningRequests(
            @Param("now") Instant now,
            @Param("warningThreshold") Instant warningThreshold,
            org.springframework.data.domain.Pageable pageable
    );
}
