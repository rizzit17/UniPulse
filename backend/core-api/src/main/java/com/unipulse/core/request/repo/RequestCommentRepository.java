package com.unipulse.core.request.repo;

import com.unipulse.core.request.domain.RequestComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RequestCommentRepository extends JpaRepository<RequestComment, UUID> {
    List<RequestComment> findByRequestIdOrderByCreatedAtAsc(UUID requestId);
    List<RequestComment> findByRequestIdAndInternalFalseOrderByCreatedAtAsc(UUID requestId);
}
