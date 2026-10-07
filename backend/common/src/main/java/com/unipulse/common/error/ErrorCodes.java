package com.unipulse.common.error;

public final class ErrorCodes {
    private ErrorCodes() {}

    public static final String INVALID_INPUT = "INVALID_INPUT";
    public static final String RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND";
    public static final String UNAUTHORIZED = "UNAUTHORIZED";
    public static final String FORBIDDEN = "FORBIDDEN";
    public static final String STALE_VERSION = "STALE_VERSION";
    public static final String ILLEGAL_TRANSITION = "ILLEGAL_TRANSITION";
    public static final String DUPLICATE_REQUEST = "DUPLICATE_REQUEST";
    public static final String RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED";
    public static final String INVALID_CREDENTIALS = "INVALID_CREDENTIALS";
    public static final String TOKEN_REVOKED = "TOKEN_REVOKED";
    public static final String TOKEN_EXPIRED = "TOKEN_EXPIRED";
    public static final String REFRESH_TOKEN_REUSE = "REFRESH_TOKEN_REUSE";
    public static final String INTERNAL_ERROR = "INTERNAL_ERROR";
}
