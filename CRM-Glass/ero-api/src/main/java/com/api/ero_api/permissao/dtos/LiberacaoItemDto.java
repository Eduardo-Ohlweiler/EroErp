package com.api.ero_api.permissao.dtos;

import com.api.ero_api.permissao.enums.GrupoLiberacao;
import com.api.ero_api.permissao.enums.NivelAcesso;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Grupo liberado e o nível")
public record LiberacaoItemDto(
        @Schema(example = "USUARIOS") @NotNull(message = "Grupo é obrigatório") GrupoLiberacao grupo,
        @Schema(example = "LER") @NotNull(message = "Nível é obrigatório") NivelAcesso nivel) {
}
