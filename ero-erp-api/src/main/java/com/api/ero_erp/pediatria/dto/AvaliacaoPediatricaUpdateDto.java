package com.api.ero_erp.pediatria.dto;

import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AvaliacaoPediatricaUpdateDto(

        Long      pessoaId,
        Long      usuarioId,
        LocalDate dataAvaliacao,

        @Pattern(regexp = "^[MF]$", message = "Sexo deve ser M ou F")
        String sexo,

        Integer    idadeMeses,
        BigDecimal peso,
        BigDecimal estatura,
        Long       formulaLacteaId,
        String     formulaNome,
        BigDecimal formulaKcalPor100ml,
        BigDecimal formulaProteinaPor100ml,
        BigDecimal volumeMl,
        BigDecimal frequenciaHoras,
        BigDecimal imc,
        String     classifPesoIdade,
        String     classifEstaturaIdade,
        String     classifImcIdade,
        BigDecimal vet,
        BigDecimal proteinaNecessidade,
        BigDecimal vezesDia,
        BigDecimal volumeTotal,
        BigDecimal caloriasTotais,
        BigDecimal proteinaTotal,
        BigDecimal percCalorico,
        BigDecimal percProteico,
        String     observacao

) {}
