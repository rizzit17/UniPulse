package com.unipulse.common.model;

public enum RequestStatus {
    OPEN,
    ASSIGNED,
    IN_PROGRESS,
    ON_HOLD,
    RESOLVED,
    CLOSED,
    REOPENED,
    CANCELLED;

    public boolean isActive() {
        return this == OPEN || this == ASSIGNED || this == IN_PROGRESS || this == ON_HOLD;
    }

    public boolean isTerminal() {
        return this == CLOSED || this == CANCELLED;
    }
}
