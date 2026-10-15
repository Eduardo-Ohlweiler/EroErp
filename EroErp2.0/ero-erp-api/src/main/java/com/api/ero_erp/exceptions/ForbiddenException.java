package com.api.ero_erp.exceptions;

import org.springframework.http.HttpStatus;

public class ForbiddenException extends ApplicationException {

    public ForbiddenException(String mensagem) {
        super(mensagem, HttpStatus.FORBIDDEN);
    }
}
