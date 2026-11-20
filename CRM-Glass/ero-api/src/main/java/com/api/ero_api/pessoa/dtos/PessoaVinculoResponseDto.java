package com.api.ero_api.pessoa.dtos;

import com.api.ero_api.pessoa.enums.TipoVinculo;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Vínculo visto da pessoa aberta: a OUTRA pessoa e o que ela é desta. O mesmo vínculo
 * aparece no cadastro da outra com o tipo inverso (Dependente ↔ Responsável,
 * Contato ↔ Empresa).
 */
@Schema(description = "Vínculo com outra pessoa")
public record PessoaVinculoResponseDto(
        @Schema(description = "A outra pessoa (id, código e nome)") PessoaSelectDto pessoa,
        @Schema(description = "false = a outra pessoa está inativa (o vínculo continua)") boolean pessoaAtiva,
        @Schema(description = "O que a outra pessoa é desta") TipoVinculo tipo,
        String observacao) {
}
