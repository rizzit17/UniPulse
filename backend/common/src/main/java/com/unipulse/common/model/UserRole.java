package com.unipulse.common.model;

public enum UserRole {
    REQUESTER,
    TECHNICIAN,
    DEPT_HEAD,
    ADMIN;

    public String asAuthority() {
        return "ROLE_" + this.name();
    }
}
