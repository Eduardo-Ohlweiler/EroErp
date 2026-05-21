package com.api.ero_erp.emitente.dtos;

import com.api.ero_erp.emitente.enums.TipoEmitente;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record EmitenteUpdateDto(

        @Schema(description = "ID da pessoa (CPF ou CNPJ) vinculada ao emitente", example = "1")
        @NotNull(message = "Pessoa é obrigatória")
        Long pessoaId,

        @Schema(description = "Tipo do emitente", example = "FILIAL")
        @NotNull(message = "Tipo é obrigatório")
        TipoEmitente tipo,

        @Schema(description = "ID da pessoa da matriz. Obrigatório quando tipo = FILIAL", example = "1")
        Long pessoaMatrizId,

        @Schema(description = "Cor de identificação do emitente na interface", example = "#3B82F6")
        @NotNull(message = "Cor é obrigatória")
        @Size(max = 50, message = "Cor deve ter no máximo 50 caracteres")
        String cor,

        @Schema(description = "Bloqueia ou desbloqueia o emitente", example = "false")
        @NotNull(message = "Bloqueado é obrigatório")
        Boolean bloqueado
) {}