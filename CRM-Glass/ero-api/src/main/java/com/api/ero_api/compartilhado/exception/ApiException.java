package com.api.ero_api.compartilhado.exception;

import org.springframework.http.HttpStatus;

/**
 * Base das exceções de negócio. A mensagem VAI para o usuário, então escreva em
 * pt-BR e sem dado interno (id de outro tenant, SQL, stack, nome de classe).
 */
public abstract class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String codigo;

    protected ApiException(HttpStatus status, String codigo, String mensagem) {
        super(mensagem);
        this.status = status;
        this.codigo = codigo;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCodigo() {
        return codigo;
    }
}
