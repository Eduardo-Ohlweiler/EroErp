package com.api.ero_api.compartilhado.exception;

import org.springframework.http.HttpStatus;

/**
 * 400 {@code VALIDACAO} num campo, para as regras que só o service enxerga (o Bean
 * Validation do DTO não sabe, por exemplo, se a cidade existe ou se o CEP veio na URL
 * com 8 dígitos). O GlobalExceptionHandler devolve {@code erros: [{campo, mensagem}]},
 * no mesmo formato do 400 do Bean Validation, para o front marcar o campo.
 *
 * <p>{@code campo} é o caminho no DTO de entrada ({@code nome}, {@code telefones[0].numero})
 * ou o nome do parâmetro na URL ({@code cep}), igual ao que o Bean Validation devolveria.
 */
public class CampoInvalidoException extends ApiException {

    private final String campo;

    public CampoInvalidoException(String campo, String mensagem) {
        super(HttpStatus.BAD_REQUEST, "VALIDACAO", mensagem);
        this.campo = campo;
    }

    public String getCampo() {
        return campo;
    }
}
