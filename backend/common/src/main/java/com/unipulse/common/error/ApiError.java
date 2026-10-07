package com.unipulse.common.error;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.net.URI;
import java.time.Instant;
import java.util.List;

/**
 * Standard error representation following RFC 7807 (problem+json).
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ApiError(
        URI type,
        String title,
        int status,
        String detail,
        URI instance,
        String code,
        Instant timestamp,
        List<InvalidParam> invalidParams
) {
    public static ApiError of(int status, String title, String detail, String code, URI instance) {
        return new ApiError(
                URI.create("about:blank"),
                title,
                status,
                detail,
                instance,
                code,
                Instant.now(),
                List.of()
        );
    }

    public static ApiError of(int status, String title, String detail, String code, URI instance, List<InvalidParam> invalidParams) {
        return new ApiError(
                URI.create("about:blank"),
                title,
                status,
                detail,
                instance,
                code,
                Instant.now(),
                invalidParams != null ? invalidParams : List.of()
        );
    }

    public record InvalidParam(String name, String reason) {}
}
