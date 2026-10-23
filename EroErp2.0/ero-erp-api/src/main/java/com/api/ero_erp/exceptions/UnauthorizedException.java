package com.api.ero_erp.exceptions;

import org.springframework.http.HttpStatus;

public class UnauthorizedException extends ApplicationException {

    public UnauthorizedException(String mensagem) {
        super(mensagem, HttpStatus.UNAUTHORIZED);
    }

    public UnauthorizedException(String mensagem, String motivo) {
        super(mensagem, HttpStatus.UNAUTHORIZED, motivo);
    }
}
