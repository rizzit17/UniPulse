package com.unipulse.common.constant;

public final class KafkaTopics {
    private KafkaTopics() {}

    public static final String REQUEST_CREATED_V1 = "request.created.v1";
    public static final String REQUEST_ASSIGNED_V1 = "request.assigned.v1";
    public static final String REQUEST_STATUS_CHANGED_V1 = "request.status-changed.v1";
    public static final String REQUEST_COMMENT_ADDED_V1 = "request.comment-added.v1";
    public static final String SLA_WARNING_V1 = "sla.warning.v1";
    public static final String SLA_BREACHED_V1 = "sla.breached.v1";

    public static final String DLQ_SUFFIX = ".dlq";
}
