package com.api.ero_erp.documento.dtos;

import com.api.ero_erp.documento.entity.DocumentoStatus;
import com.api.ero_erp.documento.entity.TipoAjuste;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record DocumentoResponseDto(

        Long id,
        Long clienteId,

        Long modeloDocumentoId,
        String modeloDocumentoNome,

        Long emitenteId,
        String emitenteNome,

        Long clientePessoaId,
        String clientePessoaNome,

        Long estoqueId,
        String produtoNome,

        LocalDate dataEmissao,
        BigDecimal valor,
        BigDecimal desconto,
        TipoAjuste tipoDesconto,
        BigDecimal acrescimo,
        TipoAjuste tipoAcrescimo,
        BigDecimal valorFinal,
        Integer numeroParcelas,

        Long formaPagamentoId,
        String formaPagamentoNome,

        DocumentoStatus status,

        String conteudoGerado,
        String observacoes,

        String createdByNome,
        String updatedByNome,
        LocalDateTime createdAt,
        LocalDateTime updatedAt

) {}
