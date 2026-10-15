package com.api.ero_erp.exceptions;

import org.springframework.http.HttpStatus;

public class BadRequestException extends ApplicationException {

    public BadRequestException(String mensagem) {
        super(mensagem, HttpStatus.BAD_REQUEST);
    }
}
