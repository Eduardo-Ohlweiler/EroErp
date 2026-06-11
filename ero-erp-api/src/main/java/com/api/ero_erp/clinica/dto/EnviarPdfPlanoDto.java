package com.api.ero_erp.clinica.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record EnviarPdfPlanoDto(

        @Schema(description = "Conteúdo do PDF em Base64")
        @NotBlank(message = "Base64 é obrigatório")
        String pdfBase64,

        @Schema(description = "ID da pessoa destinatária")
        @NotNull(message = "ID da pessoa é obrigatório")
        Long pessoaId

) {}
