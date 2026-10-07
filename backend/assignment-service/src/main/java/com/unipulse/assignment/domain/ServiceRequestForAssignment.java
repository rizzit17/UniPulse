package com.unipulse.assignment.domain;

import com.unipulse.common.model.RequestPriority;
import com.unipulse.common.model.RequestStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "service_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceRequestForAssignment {

    @Id
    private UUID id;

    @Column(name = "public_id")
    private String publicId;

    @Column(name = "department_id")
    private UUID departmentId;

    @Column(name = "category_id")
    private UUID categoryId;

    @Column(name = "assignee_id")
    private UUID assigneeId;

    @Enumerated(EnumType.STRING)
    private RequestStatus status;

    @Enumerated(EnumType.STRING)
    private RequestPriority priority;

    @Version
    @Builder.Default
    private Long version = 0L;

    @Column(name = "updated_at")
    @Builder.Default
    private Instant updatedAt = Instant.now();
}
