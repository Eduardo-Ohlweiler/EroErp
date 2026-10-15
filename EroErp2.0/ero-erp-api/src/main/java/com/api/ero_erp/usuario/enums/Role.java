package com.api.ero_erp.usuario.enums;

public enum Role {
    SUPERADMIN,
    ADMIN,
    USER;

    public String authority() {
        return "ROLE_" + name();
    }
}
