package com.api.ero_api.compartilhado.exception;

import org.springframework.http.HttpStatus;

/** 403 — autenticado, mas sem permissão para esta operação específica. */
public class AcessoNegadoException extends ApiException {

    public AcessoNegadoException(String mensagem) {
        super(HttpStatus.FORBIDDEN, "ACESSO_NEGADO", mensagem);
    }
}
