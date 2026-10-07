package com.unipulse.core.request.service;

import com.unipulse.core.request.api.RequestDtos;
import com.unipulse.core.request.domain.RequestComment;
import com.unipulse.core.request.domain.RequestHistory;
import com.unipulse.core.request.domain.ServiceRequest;
import org.springframework.stereotype.Component;

@Component
public class RequestMapper {

    public RequestDtos.RequestResponse toDto(ServiceRequest request) {
        if (request == null) {
            return null;
        }
        return new RequestDtos.RequestResponse(
                request.getId(),
                request.getPublicId(),
                request.getRequesterId(),
                request.getCategoryId(),
                request.getDepartmentId(),
                request.getAssigneeId(),
                request.getTitle(),
                request.getDescription(),
                request.getLocationBlock(),
                request.getLocationRoom(),
                request.getStatus(),
                request.getPriority(),
                request.getRespondBy(),
                request.getResolveBy(),
                request.getSlaPausedAt(),
                request.getSlaPausedTotalSeconds(),
                request.getEscalationLevel(),
                request.getVersion(),
                request.getRating(),
                request.getRatingComment(),
                request.getCreatedAt(),
                request.getUpdatedAt(),
                request.getResolvedAt()
        );
    }

    public RequestDtos.RequestHistoryResponse toDto(RequestHistory history) {
        if (history == null) {
            return null;
        }
        return new RequestDtos.RequestHistoryResponse(
                history.getId(),
                history.getRequestId(),
                history.getActorId(),
                history.getField(),
                history.getOldValue(),
                history.getNewValue(),
                history.getAt()
        );
    }

    public RequestDtos.RequestCommentResponse toDto(RequestComment comment) {
        if (comment == null) {
            return null;
        }
        return new RequestDtos.RequestCommentResponse(
                comment.getId(),
                comment.getRequestId(),
                comment.getAuthorId(),
                comment.getBody(),
                comment.isInternal(),
                comment.getCreatedAt()
        );
    }
}
