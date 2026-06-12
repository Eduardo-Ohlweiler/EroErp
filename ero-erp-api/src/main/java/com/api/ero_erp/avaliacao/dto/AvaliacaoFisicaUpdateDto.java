package com.api.ero_erp.avaliacao.dto;

import com.api.ero_erp.avaliacao.enums.ObjetivoAvaliacao;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record AvaliacaoFisicaUpdateDto(

        Long              pessoaId,
        Long              usuarioId,
        LocalDate         dataAvaliacao,
        BigDecimal        peso,
        BigDecimal        altura,
        Integer           idade,

        @Pattern(regexp = "^[MF]$", message = "Sexo deve ser M ou F")
        String            sexo,

        ObjetivoAvaliacao objetivo,
        String            metaDescricao,
        BigDecimal        pesoAlvo,
        String            observacoes,
        Boolean           ativo,

        @Valid
        List<MedidaCorporalDto> medidas,

        @Valid
        ComposicaoCorporalDto composicao

) {}
