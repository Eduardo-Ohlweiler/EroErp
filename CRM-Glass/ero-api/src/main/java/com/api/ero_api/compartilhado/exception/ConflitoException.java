package com.api.ero_api.compartilhado.exception;

import org.springframework.http.HttpStatus;

/** 409 — duplicidade ou registro alterado por outra pessoa (versão diferente). */
public class ConflitoException extends ApiException {

    public ConflitoException(String mensagem) {
        super(HttpStatus.CONFLICT, "CONFLITO", mensagem);
    }
}
