package com.api.ero_api.pessoa.dtos;

import com.api.ero_api.auxiliar.dtos.TipoTelefoneSelectDto;
import io.swagger.v3.oas.annotations.media.Schema;

/** Telefone da pessoa como a API devolve (na ordem da lista). */
@Schema(description = "Telefone da pessoa")
public record PessoaTelefoneResponseDto(
        @Schema(description = "Tipo (ativo = false: inativo, mantido porque já estava gravado)") TipoTelefoneSelectDto tipo,
        @Schema(description = "Com DDD, só dígitos") String numero,
        String observacao,
        boolean principal) {

    /** Telefone é dado pessoal: fora de qualquer log. */
    @Override
    public String toString() {
        return "PessoaTelefoneResponseDto[principal=" + principal + "]";
    }
}
