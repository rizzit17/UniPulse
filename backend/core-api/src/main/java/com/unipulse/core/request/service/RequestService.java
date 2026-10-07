package com.unipulse.core.request.service;

import com.unipulse.common.model.RequestPriority;
import com.unipulse.common.model.RequestStatus;
import com.unipulse.common.model.UserRole;
import com.unipulse.core.request.api.RequestDtos;

import java.util.List;
import java.util.UUID;

public interface RequestService {

    RequestDtos.RequestResponse createRequest(RequestDtos.CreateRequestRequest request, UUID requesterId);

    RequestDtos.RequestResponse getRequestById(UUID id, UUID currentUserId, UserRole role, UUID userDepartmentId);

    RequestDtos.RequestResponse getRequestByPublicId(String publicId, UUID currentUserId, UserRole role, UUID userDepartmentId);

    RequestDtos.CursorPageResponse<RequestDtos.RequestResponse> listRequests(
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
            UUID userDepartmentId
    );

    RequestDtos.RequestResponse updateRequest(
            UUID id,
            RequestDtos.UpdateRequestRequest request,
            Long ifMatchVersion,
            UUID actorId,
            UserRole role
    );

    RequestDtos.RequestResponse transitionStatus(
            UUID id,
            RequestDtos.TransitionStatusRequest request,
            Long ifMatchVersion,
            UUID actorId,
            UserRole role
    );

    RequestDtos.RequestResponse assignRequest(
            UUID id,
            RequestDtos.AssignRequest request,
            Long ifMatchVersion,
            UUID actorId,
            UserRole role
    );

    RequestDtos.RequestCommentResponse addComment(
            UUID id,
            RequestDtos.AddCommentRequest request,
            UUID authorId,
            UserRole role
    );

    List<RequestDtos.RequestCommentResponse> getComments(UUID id, UserRole role);

    List<RequestDtos.RequestHistoryResponse> getHistory(UUID id);

    RequestDtos.RequestResponse rateRequest(UUID id, RequestDtos.RateRequest request, UUID requesterId);
}
