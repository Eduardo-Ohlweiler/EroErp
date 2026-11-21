package com.api.ero_api.pessoa.dtos;

import com.api.ero_api.pessoa.enums.TipoVinculo;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

/**
 * Vínculo na entrada da pessoa. {@code pessoaId} é a OUTRA pessoa (não o id da linha):
 * o par é único, e a lista que chega é o estado completo dos vínculos desta pessoa.
 */
@Schema(description = "Vínculo com outra pessoa")
public record PessoaVinculoItemDto(

        @Schema(description = "Id da outra pessoa (/api/pessoas/selecao)")
        @NotNull(message = "Pessoa é obrigatória")
        UUID pessoaId,

        @Schema(description = "O que a outra pessoa é desta (ex.: DEPENDENTE = a outra é dependente desta)")
        @NotNull(message = "Tipo de vínculo é obrigatório")
        TipoVinculo tipo,

        @Size(max = 255, message = "Observação deve ter no máximo 255 caracteres")
        String observacao) {
}
