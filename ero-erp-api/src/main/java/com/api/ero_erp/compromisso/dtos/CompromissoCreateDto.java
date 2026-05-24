package com.api.ero_erp.compromisso.dtos;

import com.api.ero_erp.compromisso.enums.TipoRecorrencia;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record CompromissoCreateDto(

        @Schema(description = "Título do compromisso", example = "Reunião de planejamento")
        @NotBlank(message = "Título é obrigatório")
        @Size(max = 255, message = "Título deve ter no máximo 255 caracteres")
        String titulo,

        @Schema(description = "Descrição detalhada", example = "Reunião para alinhar metas do trimestre")
        @Size(max = 2000, message = "Descrição deve ter no máximo 2000 caracteres")
        String descricao,

        @Schema(description = "Cor do evento em hexadecimal", example = "#3a87ad")
        @Size(max = 50)
        String cor,

        @Schema(description = "Data e hora de início", example = "2025-06-10T09:00:00")
        @NotNull(message = "Início é obrigatório")
        LocalDateTime inicio,

        @Schema(description = "Data e hora de fim", example = "2025-06-10T10:00:00")
        @NotNull(message = "Fim é obrigatório")
        LocalDateTime fim,

        @Schema(description = "ID da pessoa vinculada (opcional)")
        Long pessoaId,

        @Schema(description = "Se vai ter recorrencia sim ou não")
        Boolean recorrenciaSimNao,

        @Schema(description = "Tipo de recorrência", example = "SEMANAL")
        TipoRecorrencia tipoRecorrencia,

        @Schema(description = "Quantidade total de ocorrências (incluindo a primeira)", example = "4")
        Integer quantidadeRecorrencia
) {}
