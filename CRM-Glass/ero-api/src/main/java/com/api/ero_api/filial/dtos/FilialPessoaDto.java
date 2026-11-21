package com.api.ero_api.filial.dtos;

import com.api.ero_api.pessoa.enums.TipoPessoa;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.UUID;

/**
 * A pessoa da filial, só com o que a lista e o Form da filial mostram. Inscrições,
 * endereço e o resto ficam no cadastro da pessoa ({@code GET /api/pessoas/{id}}, que exige
 * PESSOAS_LER).
 */
@Schema(description = "Pessoa da filial")
public record FilialPessoaDto(
        UUID id,
        @Schema(example = "42") Long codPessoa,
        TipoPessoa tipoPessoa,
        @Schema(description = "Nome (física) ou razão social (jurídica)") String nome,
        String nomeFantasia,
        @Schema(description = "CPF ou CNPJ, sem máscara") String documento,
        @Schema(description = "Situação da pessoa (a filial pode estar ativa com a pessoa inativa)") boolean ativo) {

    /** O documento (CPF da física) é dado pessoal: fora de qualquer log. */
    @Override
    public String toString() {
        return "FilialPessoaDto[id=" + id + ", codPessoa=" + codPessoa + "]";
    }
}
