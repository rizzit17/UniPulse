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
}
