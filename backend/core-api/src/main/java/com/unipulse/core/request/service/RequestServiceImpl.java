package com.unipulse.core.request.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.unipulse.common.constant.KafkaTopics;
import com.unipulse.common.error.ApiException;
import com.unipulse.common.error.ErrorCodes;
import com.unipulse.common.event.EventEnvelope;
import com.unipulse.common.model.RequestPriority;
import com.unipulse.common.model.RequestStatus;
import com.unipulse.common.model.UserRole;
import com.unipulse.core.department.domain.Category;
import com.unipulse.core.department.domain.SlaPolicy;
import com.unipulse.core.department.repo.CategoryRepository;
import com.unipulse.core.department.repo.SlaPolicyRepository;
import com.unipulse.core.request.api.RequestDtos;
import com.unipulse.core.request.domain.OutboxEvent;
import com.unipulse.core.request.domain.RequestComment;
import com.unipulse.core.request.domain.RequestHistory;
import com.unipulse.core.request.domain.ServiceRequest;
import com.unipulse.core.request.repo.OutboxEventRepository;
import com.unipulse.core.request.repo.RequestCommentRepository;
import com.unipulse.core.request.repo.RequestHistoryRepository;
import com.unipulse.core.request.repo.ServiceRequestRepository;
import com.unipulse.core.request.statemachine.RequestStateMachine;
import com.unipulse.core.user.domain.User;
import com.unipulse.core.user.repo.UserRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RequestServiceImpl implements RequestService {

    private final ServiceRequestRepository requestRepository;
    private final RequestHistoryRepository historyRepository;
    private final RequestCommentRepository commentRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final CategoryRepository categoryRepository;
    private final SlaPolicyRepository slaPolicyRepository;
    private final UserRepository userRepository;
    private final RequestStateMachine stateMachine;
    private final PublicIdGenerator publicIdGenerator;
    private final RequestMapper requestMapper;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public RequestDtos.RequestResponse createRequest(RequestDtos.CreateRequestRequest request, UUID requesterId) {
        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> ApiException.badRequest("Category not found with id: " + request.categoryId()));

        Instant now = Instant.now();

        // FR-REQ-1: Duplicate check (30-minute window for same requester, category, and location block)
        Instant dedupeThreshold = now.minus(Duration.ofMinutes(30));
        List<ServiceRequest> duplicates = requestRepository.findDuplicates(
                requesterId,
                category.getId(),
                request.locationBlock().trim(),
                dedupeThreshold
        );
        if (!duplicates.isEmpty()) {
            ServiceRequest existing = duplicates.get(0);
            throw new ApiException(
                    409,
                    ErrorCodes.DUPLICATE_REQUEST,
                    "Duplicate request detected in the last 30 minutes with ID: " + existing.getPublicId()
            );
        }

        // Calculate SLA deadlines from policy
        RequestPriority priority = category.getDefaultPriority();
        SlaPolicy slaPolicy = slaPolicyRepository.findById(priority)
                .orElseGet(() -> SlaPolicy.builder()
                        .priority(priority)
                        .respondMinutes(priority.getDefaultRespondMinutes())
                        .resolveMinutes(priority.getDefaultResolveMinutes())
                        .build());

        Instant respondBy = now.plus(Duration.ofMinutes(slaPolicy.getRespondMinutes()));
        Instant resolveBy = now.plus(Duration.ofMinutes(slaPolicy.getResolveMinutes()));

        String publicId = publicIdGenerator.generatePublicId();
        UUID requestId = UUID.randomUUID();

        ServiceRequest serviceRequest = ServiceRequest.builder()
                .id(requestId)
                .publicId(publicId)
                .requesterId(requesterId)
                .categoryId(category.getId())
                .departmentId(category.getDepartmentId())
                .title(request.title().trim())
                .description(request.description().trim())
                .locationBlock(request.locationBlock().trim())
                .locationRoom(request.locationRoom() != null ? request.locationRoom().trim() : null)
                .status(RequestStatus.OPEN)
                .priority(priority)
                .respondBy(respondBy)
                .resolveBy(resolveBy)
                .version(0L)
                .createdAt(now)
                .updatedAt(now)
                .build();

        ServiceRequest saved = requestRepository.saveAndFlush(serviceRequest);

        // Record history
        recordHistory(saved.getId(), requesterId, "status", null, RequestStatus.OPEN.name(), now);

        // Outbox event
        publishOutbox(
                saved.getId(),
                "RequestCreated",
                Map.of(
                        "requestId", saved.getId(),
                        "publicId", saved.getPublicId(),
                        "requesterId", saved.getRequesterId(),
                        "departmentId", saved.getDepartmentId(),
                        "categoryId", saved.getCategoryId(),
                        "priority", saved.getPriority().name(),
                        "locationBlock", saved.getLocationBlock()
                )
        );

        log.info("Created request {} (ID: {}) for requester {}", saved.getPublicId(), saved.getId(), requesterId);
        return requestMapper.toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public RequestDtos.RequestResponse getRequestById(UUID id, UUID currentUserId, UserRole role, UUID userDepartmentId) {
        ServiceRequest request = requestRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Request not found with id: " + id));

        validateReadAccess(request, currentUserId, role, userDepartmentId);
        return requestMapper.toDto(request);
    }

    @Override
    @Transactional(readOnly = true)
    public RequestDtos.RequestResponse getRequestByPublicId(String publicId, UUID currentUserId, UserRole role, UUID userDepartmentId) {
        ServiceRequest request = requestRepository.findByPublicId(publicId)
                .orElseThrow(() -> ApiException.notFound("Request not found with publicId: " + publicId));

        validateReadAccess(request, currentUserId, role, userDepartmentId);
        return requestMapper.toDto(request);
    }

    @Override
    @Transactional(readOnly = true)
    public RequestDtos.CursorPageResponse<RequestDtos.RequestResponse> listRequests(
            UUID requesterId,
            UUID departmentId,
            UUID categoryId,
            UUID assigneeId,
            RequestStatus status,
            RequestPriority priority,
            String cursor,
            int limit,
            UUID currentUserId,
            UserRole role,
            UUID userDepartmentId) {

        int pageSize = Math.min(Math.max(limit, 1), 100);

        // Decode keyset cursor
        CursorData cursorData = decodeCursor(cursor);

        Specification<ServiceRequest> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Role-based scoping (FR-REQ-6)
            if (role == UserRole.REQUESTER) {
                predicates.add(cb.equal(root.get("requesterId"), currentUserId));
            } else if (role == UserRole.TECHNICIAN) {
                if (requesterId != null) {
                    predicates.add(cb.equal(root.get("requesterId"), requesterId));
                } else if (assigneeId != null) {
                    predicates.add(cb.equal(root.get("assigneeId"), assigneeId));
                } else if (userDepartmentId != null) {
                    predicates.add(cb.equal(root.get("departmentId"), userDepartmentId));
                }
            } else if (role == UserRole.DEPT_HEAD) {
                UUID deptToFilter = (departmentId != null) ? departmentId : userDepartmentId;
                if (deptToFilter != null) {
                    predicates.add(cb.equal(root.get("departmentId"), deptToFilter));
                }
            } else if (role == UserRole.ADMIN) {
                if (departmentId != null) predicates.add(cb.equal(root.get("departmentId"), departmentId));
                if (requesterId != null) predicates.add(cb.equal(root.get("requesterId"), requesterId));
                if (assigneeId != null) predicates.add(cb.equal(root.get("assigneeId"), assigneeId));
            }

            if (categoryId != null) predicates.add(cb.equal(root.get("categoryId"), categoryId));
            if (status != null) predicates.add(cb.equal(root.get("status"), status));
            if (priority != null) predicates.add(cb.equal(root.get("priority"), priority));

            // Keyset cursor predicate: (createdAt < cursorTime) OR (createdAt == cursorTime AND id < cursorId)
            if (cursorData != null) {
                Predicate timeOlder = cb.lessThan(root.get("createdAt"), cursorData.createdAt);
                Predicate timeSame = cb.equal(root.get("createdAt"), cursorData.createdAt);
                Predicate idSmaller = cb.lessThan(root.get("id"), cursorData.id);
                predicates.add(cb.or(timeOlder, cb.and(timeSame, idSmaller)));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        // Query limit + 1 to check for next page
        List<ServiceRequest> results = requestRepository.findAll(
                spec,
                PageRequest.of(0, pageSize + 1, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")))
        ).getContent();

        boolean hasMore = results.size() > pageSize;
        List<ServiceRequest> pagedItems = hasMore ? results.subList(0, pageSize) : results;

        String nextCursor = null;
        if (hasMore && !pagedItems.isEmpty()) {
            ServiceRequest last = pagedItems.get(pagedItems.size() - 1);
            nextCursor = encodeCursor(last.getCreatedAt(), last.getId());
        }

        List<RequestDtos.RequestResponse> dtos = pagedItems.stream()
                .map(requestMapper::toDto)
                .toList();

        return new RequestDtos.CursorPageResponse<>(dtos, nextCursor, hasMore);
    }

    @Override
    @Transactional
    public RequestDtos.RequestResponse updateRequest(
            UUID id,
            RequestDtos.UpdateRequestRequest updateRequest,
            Long ifMatchVersion,
            UUID actorId,
            UserRole role) {

        ServiceRequest request = requestRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Request not found with id: " + id));

        // Optimistic locking check (FR-REQ-2)
        checkOptimisticLock(request, ifMatchVersion, updateRequest.version());

        if (role == UserRole.REQUESTER && !request.getRequesterId().equals(actorId)) {
            throw ApiException.forbidden("Requesters can only edit their own requests.");
        }

        Instant now = Instant.now();
        if (updateRequest.title() != null && !updateRequest.title().isBlank()) {
            recordHistory(id, actorId, "title", request.getTitle(), updateRequest.title().trim(), now);
            request.setTitle(updateRequest.title().trim());
        }
        if (updateRequest.description() != null && !updateRequest.description().isBlank()) {
            recordHistory(id, actorId, "description", null, updateRequest.description().trim(), now);
            request.setDescription(updateRequest.description().trim());
        }
        if (updateRequest.locationBlock() != null && !updateRequest.locationBlock().isBlank()) {
            recordHistory(id, actorId, "locationBlock", request.getLocationBlock(), updateRequest.locationBlock().trim(), now);
            request.setLocationBlock(updateRequest.locationBlock().trim());
        }
        if (updateRequest.locationRoom() != null) {
            recordHistory(id, actorId, "locationRoom", request.getLocationRoom(), updateRequest.locationRoom().trim(), now);
            request.setLocationRoom(updateRequest.locationRoom().trim());
        }

        request.setUpdatedAt(now);
        ServiceRequest saved = requestRepository.saveAndFlush(request);

        publishOutbox(id, "RequestUpdated", Map.of("requestId", id, "updatedBy", actorId));
        return requestMapper.toDto(saved);
    }

    @Override
    @Transactional
    public RequestDtos.RequestResponse transitionStatus(
            UUID id,
            RequestDtos.TransitionStatusRequest transitionReq,
            Long ifMatchVersion,
            UUID actorId,
            UserRole role) {

        ServiceRequest request = requestRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Request not found with id: " + id));

        // Optimistic concurrency check (FR-REQ-2)
        checkOptimisticLock(request, ifMatchVersion, transitionReq.version());

        RequestStatus currentStatus = request.getStatus();
        RequestStatus targetStatus = transitionReq.targetStatus();

        // Permission check based on target status
        validateTransitionPermission(request, targetStatus, actorId, role);

        // Apply state machine rules
        stateMachine.validateAndApplyTransition(request, targetStatus, transitionReq.reason());

        Instant now = Instant.now();
        recordHistory(id, actorId, "status", currentStatus.name(), targetStatus.name(), now);

        if (transitionReq.reason() != null && !transitionReq.reason().isBlank()) {
            RequestComment reasonComment = RequestComment.builder()
                    .id(UUID.randomUUID())
                    .requestId(id)
                    .authorId(actorId)
                    .body("Status changed to " + targetStatus + ": " + transitionReq.reason().trim())
                    .internal(role != UserRole.REQUESTER)
                    .createdAt(now)
                    .build();
            commentRepository.save(reasonComment);
        }

        ServiceRequest saved = requestRepository.saveAndFlush(request);

        publishOutbox(id, "RequestStatusChanged", Map.of(
                "requestId", id,
                "publicId", saved.getPublicId(),
                "oldStatus", currentStatus.name(),
                "newStatus", targetStatus.name(),
                "actorId", actorId
        ));

        log.info("Transitioned request {} from {} to {} by {}", saved.getPublicId(), currentStatus, targetStatus, actorId);
        return requestMapper.toDto(saved);
    }

    @Override
    @Transactional
    public RequestDtos.RequestResponse assignRequest(
            UUID id,
            RequestDtos.AssignRequest assignReq,
            Long ifMatchVersion,
            UUID actorId,
            UserRole role) {

        if (role != UserRole.ADMIN && role != UserRole.DEPT_HEAD) {
            throw ApiException.forbidden("Only department heads and admins can assign requests.");
        }

        ServiceRequest request = requestRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Request not found with id: " + id));

        checkOptimisticLock(request, ifMatchVersion, assignReq.version());

        User assignee = userRepository.findById(assignReq.assigneeId())
                .orElseThrow(() -> ApiException.badRequest("Assignee user not found: " + assignReq.assigneeId()));

        if (assignee.getRole() != UserRole.TECHNICIAN) {
            throw ApiException.badRequest("Assignee must have the TECHNICIAN role.");
        }

        UUID oldAssignee = request.getAssigneeId();
        request.setAssigneeId(assignee.getId());

        Instant now = Instant.now();
        recordHistory(
                id,
                actorId,
                "assignee_id",
                oldAssignee != null ? oldAssignee.toString() : null,
                assignee.getId().toString(),
                now
        );

        if (request.getStatus() == RequestStatus.OPEN) {
            stateMachine.validateAndApplyTransition(request, RequestStatus.ASSIGNED, "Assigned to " + assignee.getFullName());
            recordHistory(id, actorId, "status", RequestStatus.OPEN.name(), RequestStatus.ASSIGNED.name(), now);
        }

        request.setUpdatedAt(now);
        ServiceRequest saved = requestRepository.saveAndFlush(request);

        publishOutbox(id, "RequestAssigned", Map.of(
                "requestId", id,
                "publicId", saved.getPublicId(),
                "assigneeId", assignee.getId(),
                "actorId", actorId
        ));

        return requestMapper.toDto(saved);
    }

    @Override
    @Transactional
    public RequestDtos.RequestCommentResponse addComment(
            UUID id,
            RequestDtos.AddCommentRequest commentReq,
            UUID authorId,
            UserRole role) {

        ServiceRequest request = requestRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Request not found with id: " + id));

        if (commentReq.internal() && role == UserRole.REQUESTER) {
            throw ApiException.forbidden("Requesters cannot create internal comments.");
        }

        RequestComment comment = RequestComment.builder()
                .id(UUID.randomUUID())
                .requestId(id)
                .authorId(authorId)
                .body(commentReq.body().trim())
                .internal(commentReq.internal())
                .createdAt(Instant.now())
                .build();

        RequestComment saved = commentRepository.save(comment);

        publishOutbox(id, "CommentAdded", Map.of(
                "requestId", id,
                "commentId", saved.getId(),
                "authorId", authorId,
                "internal", saved.isInternal()
        ));

        return requestMapper.toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RequestDtos.RequestCommentResponse> getComments(UUID id, UserRole role) {
        if (!requestRepository.existsById(id)) {
            throw ApiException.notFound("Request not found with id: " + id);
        }

        // Requesters can only view public comments (internal == false)
        List<RequestComment> comments = (role == UserRole.REQUESTER)
                ? commentRepository.findByRequestIdAndInternalFalseOrderByCreatedAtAsc(id)
                : commentRepository.findByRequestIdOrderByCreatedAtAsc(id);

        return comments.stream()
                .map(requestMapper::toDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<RequestDtos.RequestHistoryResponse> getHistory(UUID id) {
        if (!requestRepository.existsById(id)) {
            throw ApiException.notFound("Request not found with id: " + id);
        }
        return historyRepository.findByRequestIdOrderByAtAsc(id).stream()
                .map(requestMapper::toDto)
                .toList();
    }

    @Override
    @Transactional
    public RequestDtos.RequestResponse rateRequest(UUID id, RequestDtos.RateRequest rateReq, UUID requesterId) {
        ServiceRequest request = requestRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Request not found with id: " + id));

        if (!request.getRequesterId().equals(requesterId)) {
            throw ApiException.forbidden("Only the original requester can submit a satisfaction rating.");
        }

        if (request.getStatus() != RequestStatus.RESOLVED && request.getStatus() != RequestStatus.CLOSED) {
            throw new ApiException(
                    409,
                    ErrorCodes.ILLEGAL_TRANSITION,
                    "Ratings can only be submitted for RESOLVED or CLOSED requests."
            );
        }

        request.setRating(rateReq.rating());
        request.setRatingComment(rateReq.comment() != null ? rateReq.comment().trim() : null);

        Instant now = Instant.now();
        request.setUpdatedAt(now);
        recordHistory(id, requesterId, "rating", null, String.valueOf(rateReq.rating()), now);

        ServiceRequest saved = requestRepository.saveAndFlush(request);
        publishOutbox(id, "RequestRated", Map.of("requestId", id, "rating", rateReq.rating()));
        return requestMapper.toDto(saved);
    }

    private void checkOptimisticLock(ServiceRequest request, Long ifMatchVersion, Long bodyVersion) {
        Long expectedVersion = (ifMatchVersion != null) ? ifMatchVersion : bodyVersion;
        if (expectedVersion != null && !Objects.equals(request.getVersion(), expectedVersion)) {
            throw new ApiException(
                    409,
                    ErrorCodes.STALE_VERSION,
                    "Resource has been modified concurrently. Expected version: " + request.getVersion()
            );
        }
    }

    private void validateReadAccess(ServiceRequest request, UUID currentUserId, UserRole role, UUID userDepartmentId) {
        if (role == UserRole.ADMIN) {
            return;
        }
        if (role == UserRole.REQUESTER && !request.getRequesterId().equals(currentUserId)) {
            throw ApiException.forbidden("You do not have access to this service request.");
        }
        if (role == UserRole.TECHNICIAN) {
            boolean isAssignee = currentUserId.equals(request.getAssigneeId());
            boolean isSameDept = userDepartmentId != null && userDepartmentId.equals(request.getDepartmentId());
            if (!isAssignee && !isSameDept) {
                throw ApiException.forbidden("You do not have access to this service request.");
            }
        }
        if (role == UserRole.DEPT_HEAD && userDepartmentId != null && !userDepartmentId.equals(request.getDepartmentId())) {
            throw ApiException.forbidden("You do not have access to this service request.");
        }
    }

    private void validateTransitionPermission(ServiceRequest request, RequestStatus targetStatus, UUID actorId, UserRole role) {
        if (role == UserRole.ADMIN) {
            return;
        }
        if (targetStatus == RequestStatus.CANCELLED) {
            if (!request.getRequesterId().equals(actorId)) {
                throw ApiException.forbidden("Only the requester can cancel this request.");
            }
        } else if (targetStatus == RequestStatus.REOPENED || targetStatus == RequestStatus.CLOSED) {
            if (!request.getRequesterId().equals(actorId)) {
                throw ApiException.forbidden("Only the requester can close or reopen this request.");
            }
        } else if (targetStatus == RequestStatus.IN_PROGRESS || targetStatus == RequestStatus.ON_HOLD || targetStatus == RequestStatus.RESOLVED) {
            if (role != UserRole.TECHNICIAN && role != UserRole.DEPT_HEAD) {
                throw ApiException.forbidden("Only technicians or department heads can perform this action.");
            }
        }
    }

    private void recordHistory(UUID requestId, UUID actorId, String field, String oldValue, String newValue, Instant at) {
        RequestHistory history = RequestHistory.builder()
                .requestId(requestId)
                .actorId(actorId)
                .field(field)
                .oldValue(oldValue)
                .newValue(newValue)
                .at(at)
                .build();
        historyRepository.save(history);
    }

    private void publishOutbox(UUID aggregateId, String type, Object data) {
        try {
            EventEnvelope<Object> envelope = EventEnvelope.of(
                    type,
                    aggregateId,
                    org.slf4j.MDC.get("correlationId"),
                    data
            );

            String json = objectMapper.writeValueAsString(envelope);

            OutboxEvent outboxEvent = OutboxEvent.builder()
                    .id(UUID.randomUUID())
                    .aggregateId(aggregateId)
                    .type(type)
                    .payload(json)
                    .createdAt(Instant.now())
                    .build();

            outboxEventRepository.save(outboxEvent);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize outbox event payload", e);
            throw new ApiException(500, ErrorCodes.INTERNAL_ERROR, "Failed to persist outbox event.");
        }
    }

    private record CursorData(Instant createdAt, UUID id) {}

    private String encodeCursor(Instant createdAt, UUID id) {
        String raw = createdAt.toString() + "_" + id.toString();
        return Base64.getUrlEncoder().withoutPadding().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    private CursorData decodeCursor(String cursor) {
        if (cursor == null || cursor.isBlank()) {
            return null;
        }
        try {
            String decoded = new String(Base64.getUrlDecoder().decode(cursor), StandardCharsets.UTF_8);
            String[] parts = decoded.split("_");
            if (parts.length == 2) {
                return new CursorData(Instant.parse(parts[0]), UUID.fromString(parts[1]));
            }
        } catch (Exception e) {
            log.warn("Invalid cursor passed: {}", cursor);
        }
        return null;
    }
}
