package com.api.ero_erp.pessoavinculo.dtos;

import com.api.ero_erp.pessoavinculo.enums.TipoVinculo;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PessoaVinculoItemDto(

        @Schema(description = "ID do vínculo (null para novos)")
        Long id,

        @Schema(description = "ID da OUTRA pessoa do vínculo")
        @NotNull(message = "Pessoa do vínculo é obrigatória")
        Long pessoaId,

        @Schema(description = "Papel da outra pessoa em relação à pessoa atual")
        @NotNull(message = "Tipo de vínculo é obrigatório")
        TipoVinculo tipo,

        @Schema(description = "Observação sobre o vínculo")
        @Size(max = 255)
        String observacao
) {}
