package com.api.ero_erp.avaliacao.dto;

import java.math.BigDecimal;

public record ComposicaoCorporalDto(

        BigDecimal percentualGordura,
        BigDecimal massaMuscularKg,
        BigDecimal massaGordaKg,
        BigDecimal massaOsseaKg,
        BigDecimal aguaCorporalPercentual,
        Integer    metabolismoBasal,
        Integer    idadeMetabolica

) {}
