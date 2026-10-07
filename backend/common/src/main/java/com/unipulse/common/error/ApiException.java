package com.unipulse.common.error;

import lombok.Getter;

/**
 * Base unchecked exception for UniPulse business and validation errors.
 */
@Getter
public class ApiException extends RuntimeException {
    private final int status;
    private final String code;

    public ApiException(int status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public ApiException(int status, String code, String message, Throwable cause) {
        super(message, cause);
        this.status = status;
        this.code = code;
    }

    public static ApiException notFound(String message) {
        return new ApiException(404, ErrorCodes.RESOURCE_NOT_FOUND, message);
    }

    public static ApiException badRequest(String message) {
        return new ApiException(400, ErrorCodes.INVALID_INPUT, message);
    }

    public static ApiException conflict(String code, String message) {
        return new ApiException(409, code, message);
    }

    public static ApiException conflict(String message) {
        return new ApiException(409, ErrorCodes.DUPLICATE_RESOURCE, message);
    }

    public static ApiException forbidden(String message) {
        return new ApiException(403, ErrorCodes.FORBIDDEN, message);
    }

    public static ApiException unauthorized(String message) {
        return new ApiException(401, ErrorCodes.UNAUTHORIZED, message);
    }
}
