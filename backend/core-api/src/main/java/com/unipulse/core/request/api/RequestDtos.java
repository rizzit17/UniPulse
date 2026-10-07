package com.unipulse.core.request.api;

import com.unipulse.common.model.RequestPriority;
import com.unipulse.common.model.RequestStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class RequestDtos {

    private RequestDtos() {}

    public record CreateRequestRequest(
            @NotBlank(message = "Title is required")
            @Size(min = 5, max = 120, message = "Title must be between 5 and 120 characters")
            String title,

            @NotBlank(message = "Description is required")
            @Size(min = 10, max = 2000, message = "Description must be between 10 and 2000 characters")
            String description,

            @NotNull(message = "Category ID is required")
            UUID categoryId,

            @NotBlank(message = "Location block is required")
            String locationBlock,

            String locationRoom
    ) {}

    public record UpdateRequestRequest(
            @Size(min = 5, max = 120, message = "Title must be between 5 and 120 characters")
            String title,

            @Size(min = 10, max = 2000, message = "Description must be between 10 and 2000 characters")
            String description,

            String locationBlock,
            String locationRoom,
            Long version
    ) {}

    public record TransitionStatusRequest(
            @NotNull(message = "Target status is required")
            RequestStatus targetStatus,

            String reason,
            Long version
    ) {}

    public record AssignRequest(
            @NotNull(message = "Assignee ID is required")
            UUID assigneeId,

            Long version
    ) {}

    public record AddCommentRequest(
            @NotBlank(message = "Comment body is required")
            @Size(min = 1, max = 2000, message = "Comment must be between 1 and 2000 characters")
            String body,

            boolean internal
    ) {}

    public record RateRequest(
            @Min(value = 1, message = "Rating must be between 1 and 5")
            @Max(value = 5, message = "Rating must be between 1 and 5")
            int rating,

            String comment
    ) {}

    public record RequestResponse(
            UUID id,
            String publicId,
            UUID requesterId,
            UUID categoryId,
            UUID departmentId,
            UUID assigneeId,
            String title,
            String description,
            String locationBlock,
            String locationRoom,
            RequestStatus status,
            RequestPriority priority,
            Instant respondBy,
            Instant resolveBy,
            Instant slaPausedAt,
            int slaPausedTotalSeconds,
            short escalationLevel,
            Long version,
            Integer rating,
            String ratingComment,
            Instant createdAt,
            Instant updatedAt,
            Instant resolvedAt
    ) {}

    public record RequestHistoryResponse(
            Long id,
            UUID requestId,
            UUID actorId,
            String field,
            String oldValue,
            String newValue,
            Instant at
    ) {}

    public record RequestCommentResponse(
            UUID id,
            UUID requestId,
            UUID authorId,
            String body,
            boolean internal,
            Instant createdAt
    ) {}

    public record CursorPageResponse<T>(
            List<T> items,
            String nextCursor,
            boolean hasMore
    ) {}
}
