package com.api.ero_api.compartilhado.exception;

import org.springframework.http.HttpStatus;

/** 503 — um serviço externo (ex.: envio de e-mail) não respondeu. Nada foi feito; dá para tentar de novo. */
public class ServicoIndisponivelException extends ApiException {

    public ServicoIndisponivelException(String mensagem) {
        super(HttpStatus.SERVICE_UNAVAILABLE, "SERVICO_INDISPONIVEL", mensagem);
    }
}
