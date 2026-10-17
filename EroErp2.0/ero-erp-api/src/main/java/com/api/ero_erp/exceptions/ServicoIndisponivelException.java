package com.api.ero_erp.exceptions;

import org.springframework.http.HttpStatus;

/** Serviço externo fora do ar ou lento demais: não é erro do usuário nem do sistema. */
public class ServicoIndisponivelException extends ApplicationException {

    public ServicoIndisponivelException(String mensagem) {
        super(mensagem, HttpStatus.SERVICE_UNAVAILABLE);
    }
}
