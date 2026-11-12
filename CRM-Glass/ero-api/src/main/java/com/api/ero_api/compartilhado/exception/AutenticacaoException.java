package com.api.ero_api.compartilhado.exception;

import org.springframework.http.HttpStatus;

/** 401 — falha de login/sessão. Use mensagem genérica (não revele se o e-mail existe). */
public class AutenticacaoException extends ApiException {

    public AutenticacaoException(String mensagem) {
        super(HttpStatus.UNAUTHORIZED, "NAO_AUTENTICADO", mensagem);
    }

    /**
     * Quando o front precisa agir diferente conforme o motivo (ex.: na 2ª etapa do
     * login, {@code DESAFIO_EXPIRADO} volta para a senha e {@code CODIGO_INVALIDO}
     * deixa tentar de novo). O código também não pode revelar se a conta existe.
     */
    public AutenticacaoException(String codigo, String mensagem) {
        super(HttpStatus.UNAUTHORIZED, codigo, mensagem);
    }
}
