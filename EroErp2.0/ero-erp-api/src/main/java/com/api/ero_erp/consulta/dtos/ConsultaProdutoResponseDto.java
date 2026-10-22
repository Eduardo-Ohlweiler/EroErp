package com.api.ero_erp.consulta.dtos;

import com.api.ero_erp.consulta.enums.TipoAjuste;
import com.api.ero_erp.consulta.enums.TipoCalculo;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * @param controlaEstoque o produto controla estoque na filial do
 *                        compromisso: concluir vai baixar
 * @param saldoDisponivel o saldo de agora, só quando controla — para a tela
 *                        avisar a falta antes de concluir; o aviso não bloqueia
 */
public record ConsultaProdutoResponseDto(
        UUID id,
        UUID produtoId,
        Long produtoCodigo,
        String descricao,
        String unidadeSigla,
        BigDecimal quantidade,
        BigDecimal precoUnitario,
        TipoAjuste tipoAjuste,
        TipoCalculo tipoCalculo,
        BigDecimal valorAjuste,
        BigDecimal subtotal,
        BigDecimal ajuste,
        BigDecimal total,
        Boolean controlaEstoque,
        BigDecimal saldoDisponivel
) {}
