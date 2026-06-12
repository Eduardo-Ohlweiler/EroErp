package com.api.ero_erp.avaliacao.dto;

import com.api.ero_erp.avaliacao.enums.ObjetivoAvaliacao;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record AvaliacaoFisicaCreateDto(

        @Schema(description = "ID da pessoa avaliada")
        @NotNull(message = "Pessoa é obrigatória")
        Long pessoaId,

        @Schema(description = "ID do usuário responsável (nutricionista/personal) — opcional")
        Long usuarioId,

        @Schema(description = "Data da avaliação")
        @NotNull(message = "Data da avaliação é obrigatória")
        LocalDate dataAvaliacao,

        @Schema(description = "Peso em kg", example = "75.5")
        @NotNull(message = "Peso é obrigatório")
        BigDecimal peso,

        @Schema(description = "Altura em cm", example = "170.0")
        @NotNull(message = "Altura é obrigatória")
        BigDecimal altura,

        @Schema(description = "Idade em anos")
        @NotNull(message = "Idade é obrigatória")
        Integer idade,

        @Schema(description = "Sexo: M ou F")
        @NotNull(message = "Sexo é obrigatório")
        @Pattern(regexp = "^[MF]$", message = "Sexo deve ser M ou F")
        String sexo,

        @Schema(description = "Objetivo da avaliação")
        @NotNull(message = "Objetivo é obrigatório")
        ObjetivoAvaliacao objetivo,

        @Schema(description = "Descrição da meta")
        String metaDescricao,

        @Schema(description = "Peso alvo em kg (opcional)", example = "65.0")
        BigDecimal pesoAlvo,

        @Schema(description = "Observações gerais")
        String observacoes,

        @Schema(description = "Medidas corporais (lista de pontos)")
        @Valid
        List<MedidaCorporalDto> medidas,

        @Schema(description = "Dados de bioimpedância (opcional)")
        @Valid
        ComposicaoCorporalDto composicao

) {}
