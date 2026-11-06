package com.api.ero_api.compartilhado.exception;

import org.springframework.http.HttpStatus;

/** 422 — a requisição é válida, mas uma regra de negócio impede a operação. */
public class RegraNegocioException extends ApiException {

    public RegraNegocioException(String mensagem) {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "REGRA_NEGOCIO", mensagem);
    }
}
