package com.unipulse.assignment.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public record RequestCreatedPayload(
        UUID requestId,
        String publicId,
        UUID requesterId,
        UUID departmentId,
        UUID categoryId,
        String priority,
        String locationBlock
) {}
