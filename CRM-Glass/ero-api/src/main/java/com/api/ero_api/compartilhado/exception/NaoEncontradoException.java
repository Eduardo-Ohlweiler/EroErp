package com.api.ero_api.compartilhado.exception;

import org.springframework.http.HttpStatus;

/** 404 — registro não existe OU é de outro tenant (nunca diferencie os dois casos). */
public class NaoEncontradoException extends ApiException {

    public NaoEncontradoException(String mensagem) {
        super(HttpStatus.NOT_FOUND, "NAO_ENCONTRADO", mensagem);
    }
}
