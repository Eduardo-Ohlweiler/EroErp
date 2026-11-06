package com.api.ero_api.compartilhado.exception;

import org.springframework.http.HttpStatus;

/** 429 — limite de requisições atingido. */
public class MuitasRequisicoesException extends ApiException {

    public MuitasRequisicoesException(String mensagem) {
        super(HttpStatus.TOO_MANY_REQUESTS, "MUITAS_REQUISICOES", mensagem);
    }
}
