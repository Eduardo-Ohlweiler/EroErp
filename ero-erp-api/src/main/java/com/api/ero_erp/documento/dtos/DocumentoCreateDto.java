package com.api.ero_erp.documento.dtos;

import com.api.ero_erp.documento.entity.TipoAjuste;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DocumentoCreateDto(

        @NotNull(message = "Modelo de documento é obrigatório")
        Long modeloDocumentoId,

        @NotNull(message = "Emitente é obrigatório")
        Long emitenteId,

        @NotNull(message = "Pessoa do cliente é obrigatória")
        Long clientePessoaId,

        Long estoqueId,

        @NotNull(message = "Data de emissão é obrigatória")
        LocalDate dataEmissao,

        BigDecimal valor,
        BigDecimal desconto,
        TipoAjuste tipoDesconto,
        BigDecimal acrescimo,
        TipoAjuste tipoAcrescimo,
        Integer numeroParcelas,
        Long formaPagamentoId,
        String observacoes

) {}
