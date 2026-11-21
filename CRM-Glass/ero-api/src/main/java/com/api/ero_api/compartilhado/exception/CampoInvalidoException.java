package com.api.ero_api.compartilhado.exception;

import com.api.ero_api.compartilhado.dtos.ErroCampoDto;
import java.util.List;
import org.springframework.http.HttpStatus;

/**
 * 400 {@code VALIDACAO} num campo, para as regras que só o service enxerga (o Bean
 * Validation do DTO não sabe, por exemplo, se a cidade existe ou se o CEP veio na URL
 * com 8 dígitos). O GlobalExceptionHandler devolve {@code erros: [{campo, mensagem}]},
 * no mesmo formato do 400 do Bean Validation, para o front marcar o campo.
 *
 * <p>{@code campo} é o caminho no DTO de entrada ({@code nome}, {@code telefones[0].numero})
 * ou o nome do parâmetro na URL ({@code cep}), igual ao que o Bean Validation devolveria.
 *
 * <p>Quando o service confere várias linhas de uma vez (as filiais do serviço), todos os
 * campos recusados saem num 400 só ({@link #CampoInvalidoException(List)}), como o Bean
 * Validation faz: o usuário corrige tudo de uma vez.
 */
public class CampoInvalidoException extends ApiException {

    private final List<ErroCampoDto> erros;

    public CampoInvalidoException(String campo, String mensagem) {
        super(HttpStatus.BAD_REQUEST, "VALIDACAO", mensagem);
        this.erros = List.of(new ErroCampoDto(campo, mensagem));
    }

    /**
     * Vários campos recusados de uma vez (pelo menos um). Com um só, o {@code detail} é a
     * mensagem dele; com mais, "Existem campos inválidos.", como o 400 do Bean Validation.
     */
    public CampoInvalidoException(List<ErroCampoDto> erros) {
        super(HttpStatus.BAD_REQUEST, "VALIDACAO",
                erros.size() == 1 ? erros.getFirst().mensagem() : "Existem campos inválidos.");
        this.erros = List.copyOf(erros);
    }

    public List<ErroCampoDto> getErros() {
        return erros;
    }
}
