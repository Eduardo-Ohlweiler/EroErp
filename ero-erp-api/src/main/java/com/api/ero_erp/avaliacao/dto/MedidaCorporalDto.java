package com.api.ero_erp.avaliacao.dto;

import com.api.ero_erp.avaliacao.enums.PontoMedicao;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record MedidaCorporalDto(

        @NotNull(message = "Ponto de medição é obrigatório")
        PontoMedicao pontoMedicao,

        @NotNull(message = "Valor é obrigatório")
        BigDecimal valorCm

) {}
