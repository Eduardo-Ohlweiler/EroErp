package com.api.ero_api.pessoa.dtos;

import com.api.ero_api.auxiliar.dtos.TipoEmailSelectDto;
import io.swagger.v3.oas.annotations.media.Schema;

/** E-mail da pessoa como a API devolve (na ordem da lista). */
@Schema(description = "E-mail da pessoa")
public record PessoaEmailResponseDto(
        @Schema(description = "Tipo (ativo = false: inativo, mantido porque já estava gravado)") TipoEmailSelectDto tipo,
        @Schema(description = "Sempre minúsculo") String email,
        String observacao,
        boolean principal) {

    /** E-mail é dado pessoal: fora de qualquer log. */
    @Override
    public String toString() {
        return "PessoaEmailResponseDto[principal=" + principal + "]";
    }
}
