package com.unipulse.core.department.repo;

import com.unipulse.common.model.RequestPriority;
import com.unipulse.core.department.domain.SlaPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SlaPolicyRepository extends JpaRepository<SlaPolicy, RequestPriority> {
}
