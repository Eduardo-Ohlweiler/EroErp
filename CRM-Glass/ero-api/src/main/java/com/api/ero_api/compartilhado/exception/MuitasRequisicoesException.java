package com.api.ero_api.compartilhado.exception;

import org.springframework.http.HttpStatus;

/**
 * 429 — limite de requisições atingido. Com {@code segundosParaTentar}, o
 * GlobalExceptionHandler devolve também o cabeçalho {@code Retry-After}.
 */
public class MuitasRequisicoesException extends ApiException {

    private final Long segundosParaTentar;

    public MuitasRequisicoesException(String mensagem) {
        this(mensagem, null);
    }

    public MuitasRequisicoesException(String mensagem, Long segundosParaTentar) {
        super(HttpStatus.TOO_MANY_REQUESTS, "MUITAS_REQUISICOES", mensagem);
        this.segundosParaTentar = segundosParaTentar;
    }

    public Long getSegundosParaTentar() {
        return segundosParaTentar;
    }
}
