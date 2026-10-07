package com.unipulse.core.department.repo;

import com.unipulse.core.department.domain.TechnicianProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface TechnicianProfileRepository extends JpaRepository<TechnicianProfile, UUID> {
}
