package com.api.ero_erp.clinica.dto;

import com.api.ero_erp.clinica.enums.TipoFinalidade;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

public record TemplateAnamneseUpdateDto(

        @Schema(description = "Nome do template", example = "Anamnese Estética Completa")
        @Size(max = 200, message = "Nome deve ter no máximo 200 caracteres")
        String nome,

        @Schema(description = "Finalidade do template")
        TipoFinalidade finalidade,

        @Schema(description = "Descrição opcional do template")
        String descricao,

        @Schema(description = "Indica se o template está ativo")
        Boolean ativo

) {}
