package com.api.ero_erp.avaliacao.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

public record EnviarPdfAvaliacaoDto(

        @Schema(description = "Conteúdo do PDF em Base64")
        @NotBlank(message = "Base64 é obrigatório")
        String base64,

        @Schema(description = "Nome do arquivo PDF", example = "avaliacao-fisica.pdf")
        String fileName,

        @Schema(description = "Legenda/caption da mensagem enviada")
        String caption

) {}
