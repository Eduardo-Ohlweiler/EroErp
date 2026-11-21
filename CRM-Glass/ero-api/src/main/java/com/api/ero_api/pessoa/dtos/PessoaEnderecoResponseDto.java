package com.api.ero_api.pessoa.dtos;

import com.api.ero_api.auxiliar.dtos.TipoEnderecoSelectDto;
import com.api.ero_api.localidade.dtos.CidadeSelectDto;
import io.swagger.v3.oas.annotations.media.Schema;

/** Endereço da pessoa como a API devolve (na ordem da lista). */
@Schema(description = "Endereço da pessoa")
public record PessoaEnderecoResponseDto(
        @Schema(description = "Tipo (ativo = false: inativo, mantido porque já estava gravado)") TipoEnderecoSelectDto tipo,
        @Schema(description = "8 dígitos ou nulo") String cep,
        CidadeSelectDto cidade,
        String rua,
        String numero,
        String bairro,
        String complemento,
        boolean principal) {

    /** Endereço é dado pessoal: fora de qualquer log. */
    @Override
    public String toString() {
        return "PessoaEnderecoResponseDto[principal=" + principal + "]";
    }
}
