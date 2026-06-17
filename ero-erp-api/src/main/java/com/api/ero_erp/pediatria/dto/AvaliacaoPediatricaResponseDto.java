package com.api.ero_erp.pediatria.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record AvaliacaoPediatricaResponseDto(
        Long          id,
        Long          pessoaId,
        String        pessoaNome,
        Long          usuarioId,
        LocalDate     dataAvaliacao,
        String        sexo,
        Integer       idadeMeses,
        BigDecimal    peso,
        BigDecimal    estatura,
        Long          formulaLacteaId,
        String        formulaNome,
        BigDecimal    formulaKcalPor100ml,
        BigDecimal    formulaProteinaPor100ml,
        BigDecimal    volumeMl,
        BigDecimal    frequenciaHoras,
        BigDecimal    imc,
        String        classifPesoIdade,
        String        classifEstaturaIdade,
        String        classifImcIdade,
        BigDecimal    vet,
        BigDecimal    proteinaNecessidade,
        BigDecimal    vezesDia,
        BigDecimal    volumeTotal,
        BigDecimal    caloriasTotais,
        BigDecimal    proteinaTotal,
        BigDecimal    percCalorico,
        BigDecimal    percProteico,
        String        observacao,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
