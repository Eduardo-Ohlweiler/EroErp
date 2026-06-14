package com.api.ero_erp.documento.dtos;

import com.api.ero_erp.documento.entity.TipoAjuste;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DocumentoUpdateDto(

        Long modeloDocumentoId,
        Long emitenteId,
        Long clientePessoaId,
        Long estoqueId,
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
