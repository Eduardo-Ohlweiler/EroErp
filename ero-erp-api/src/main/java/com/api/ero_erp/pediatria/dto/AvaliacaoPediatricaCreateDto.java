package com.api.ero_erp.pediatria.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AvaliacaoPediatricaCreateDto(

        @Schema(description = "ID da pessoa avaliada")
        @NotNull(message = "Pessoa é obrigatória")
        Long pessoaId,

        @Schema(description = "ID do profissional responsável — opcional")
        Long usuarioId,

        @Schema(description = "Data da avaliação")
        @NotNull(message = "Data da avaliação é obrigatória")
        LocalDate dataAvaliacao,

        @Schema(description = "Sexo: M ou F")
        @NotNull(message = "Sexo é obrigatório")
        @Pattern(regexp = "^[MF]$", message = "Sexo deve ser M ou F")
        String sexo,

        @Schema(description = "Idade em meses")
        @NotNull(message = "Idade em meses é obrigatória")
        Integer idadeMeses,

        @Schema(description = "Peso em kg", example = "8.50")
        @NotNull(message = "Peso é obrigatório")
        BigDecimal peso,

        @Schema(description = "Estatura em cm", example = "68.00")
        BigDecimal estatura,

        @Schema(description = "ID da fórmula láctea utilizada — opcional")
        Long formulaLacteaId,

        @Schema(description = "Snapshot: nome da fórmula")
        String formulaNome,

        @Schema(description = "Snapshot: kcal por 100ml da fórmula")
        BigDecimal formulaKcalPor100ml,

        @Schema(description = "Snapshot: proteína por 100ml da fórmula")
        BigDecimal formulaProteinaPor100ml,

        @Schema(description = "Volume por mamada em ml")
        BigDecimal volumeMl,

        @Schema(description = "Frequência em horas")
        BigDecimal frequenciaHoras,

        @Schema(description = "IMC calculado")
        BigDecimal imc,

        @Schema(description = "Classificação peso/idade")
        String classifPesoIdade,

        @Schema(description = "Classificação estatura/idade")
        String classifEstaturaIdade,

        @Schema(description = "Classificação IMC/idade")
        String classifImcIdade,

        @Schema(description = "VET — valor energético total")
        BigDecimal vet,

        @Schema(description = "Necessidade de proteína")
        BigDecimal proteinaNecessidade,

        @Schema(description = "Vezes ao dia")
        BigDecimal vezesDia,

        @Schema(description = "Volume total diário")
        BigDecimal volumeTotal,

        @Schema(description = "Calorias totais")
        BigDecimal caloriasTotais,

        @Schema(description = "Proteína total")
        BigDecimal proteinaTotal,

        @Schema(description = "Percentual calórico")
        BigDecimal percCalorico,

        @Schema(description = "Percentual proteico")
        BigDecimal percProteico,

        @Schema(description = "Observação")
        String observacao

) {}
