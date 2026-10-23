package com.api.ero_erp.exceptions;

import org.springframework.http.HttpStatus;

public abstract class ApplicationException extends RuntimeException {

    private final HttpStatus status;
    private final String motivo;

    protected ApplicationException(String mensagem, HttpStatus status) {
        this(mensagem, status, null);
    }

    /** @param motivo a marca que vai em {@link ErroResponseDto#motivo()}; nula na maioria. */
    protected ApplicationException(String mensagem, HttpStatus status, String motivo) {
        super(mensagem);
        this.status = status;
        this.motivo = motivo;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getMotivo() {
        return motivo;
    }
}
