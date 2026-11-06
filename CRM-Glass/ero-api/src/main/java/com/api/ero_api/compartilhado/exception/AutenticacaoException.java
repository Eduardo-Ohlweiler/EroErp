package com.api.ero_api.compartilhado.exception;

import org.springframework.http.HttpStatus;

/** 401 — falha de login/sessão. Use mensagem genérica (não revele se o e-mail existe). */
public class AutenticacaoException extends ApiException {

    public AutenticacaoException(String mensagem) {
        super(HttpStatus.UNAUTHORIZED, "NAO_AUTENTICADO", mensagem);
    }
}
