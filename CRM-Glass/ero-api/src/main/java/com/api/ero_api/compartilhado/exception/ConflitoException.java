package com.api.ero_api.compartilhado.exception;

import org.springframework.http.HttpStatus;

/**
 * 409 — registro alterado por outra pessoa (versão diferente). Sai sem {@code erros}.
 * Duplicidade num campo usa {@link ConflitoCampoException}, que traz o campo.
 */
public class ConflitoException extends ApiException {

    public ConflitoException(String mensagem) {
        super(HttpStatus.CONFLICT, "CONFLITO", mensagem);
    }
}
