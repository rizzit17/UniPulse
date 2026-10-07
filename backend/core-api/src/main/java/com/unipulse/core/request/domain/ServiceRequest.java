package com.unipulse.core.request.domain;

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
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "service_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(onlyExplicitlyIncluded = true)
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class ServiceRequest {

    @Id
    @EqualsAndHashCode.Include
    @ToString.Include
    private UUID id;

    @Column(name = "public_id", nullable = false, unique = true)
    @ToString.Include
    private String publicId;

    @Column(name = "requester_id", nullable = false)
    private UUID requesterId;

    @Column(name = "category_id", nullable = false)
    private UUID categoryId;

    @Column(name = "department_id", nullable = false)
    private UUID departmentId;

    @Column(name = "assignee_id")
    private UUID assigneeId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 2000)
    private String description;

    @Column(name = "location_block", nullable = false)
    private String locationBlock;

    @Column(name = "location_room")
    private String locationRoom;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @ToString.Include
    private RequestStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @ToString.Include
    private RequestPriority priority;

    @Column(name = "respond_by", nullable = false)
    private Instant respondBy;

    @Column(name = "resolve_by", nullable = false)
    private Instant resolveBy;

    @Column(name = "sla_paused_at")
    private Instant slaPausedAt;

    @Column(name = "sla_paused_total_seconds", nullable = false)
    @Builder.Default
    private int slaPausedTotalSeconds = 0;

    @Column(name = "escalation_level", nullable = false)
    @Builder.Default
    private short escalationLevel = 0;

    @Version
    @Column(nullable = false)
    @Builder.Default
    private Long version = 0L;

    @Column(name = "rating")
    private Integer rating;

    @Column(name = "rating_comment")
    private String ratingComment;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @Column(name = "resolved_at")
    private Instant resolvedAt;
}
