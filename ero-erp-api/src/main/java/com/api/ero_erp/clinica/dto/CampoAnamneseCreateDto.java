package com.api.ero_erp.clinica.dto;

import com.api.ero_erp.clinica.enums.TipoCampoAnamnese;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CampoAnamneseCreateDto(

        @Schema(description = "Seção/grupo ao qual o campo pertence", example = "Histórico de Saúde")
        @Size(max = 200, message = "Seção deve ter no máximo 200 caracteres")
        String secao,

        @Schema(description = "Rótulo/pergunta do campo", example = "Possui alguma alergia?")
        @NotBlank(message = "Rótulo é obrigatório")
        @Size(max = 300, message = "Rótulo deve ter no máximo 300 caracteres")
        String rotulo,

        @Schema(description = "Tipo do campo de resposta")
        @NotNull(message = "Tipo é obrigatório")
        TipoCampoAnamnese tipo,

        @Schema(description = "Opções em formato JSON array (para tipos OPCOES e MULTIPLAS_OPCOES)", example = "[\"Sim\",\"Não\",\"Não sei\"]")
        String opcoes,

        @Schema(description = "Posição de exibição do campo", example = "1")
        Integer ordem,

        @Schema(description = "Indica se o campo é obrigatório", example = "false")
        Boolean obrigatorio,

        @Schema(description = "Indica se o campo está ativo", example = "true")
        Boolean ativo

) {}
