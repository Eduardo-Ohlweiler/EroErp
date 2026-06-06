package com.api.ero_erp.financeiro.pagarcontas.dtos;

import java.math.BigDecimal;

public record PagarContasItemDto(
        String     tipo,
        Long       parcelaId,
        Integer    numeroParcela,
        Long       contaId,
        String     descricao,
        Long       emitenteId,
        String     emitenteNome,
        String     emitenteDocumento,
        Long       pessoaId,
        String     pessoaNome,
        String     pessoaDocumento,
        String     dataVencimento,
        BigDecimal valor,
        Long       formaPagamentoId,
        String     formaPagamentoNome,
        Long       contaFinanceiraId,
        String     contaFinanceiraNome,
        String     status,
        String     dataPagamento,
        BigDecimal valorPago
) {}
