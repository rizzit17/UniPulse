package com.unipulse.core.request.service;

import com.unipulse.core.request.api.RequestDtos;
import com.unipulse.core.request.domain.RequestComment;
import com.unipulse.core.request.domain.RequestHistory;
import com.unipulse.core.request.domain.ServiceRequest;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface RequestMapper {
    RequestDtos.RequestResponse toDto(ServiceRequest request);
    RequestDtos.RequestHistoryResponse toDto(RequestHistory history);
    RequestDtos.RequestCommentResponse toDto(RequestComment comment);
}
