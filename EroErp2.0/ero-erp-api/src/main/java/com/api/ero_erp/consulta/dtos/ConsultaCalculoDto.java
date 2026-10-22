package com.api.ero_erp.consulta.dtos;

import java.math.BigDecimal;
import java.util.List;

/**
 * Os totais de um corpo de consulta, sem gravar. Os itens vêm na ordem em
 * que foram mandados; uma lista que não veio (e não estava gravada) volta
 * vazia.
 */
public record ConsultaCalculoDto(
        List<Valores> servicos,
        List<Valores> produtos,
        BigDecimal subtotalServicos,
        BigDecimal subtotalProdutos,
        BigDecimal subtotal,
        BigDecimal ajusteGeral,
        BigDecimal total
) {

    /**
     * @param precoUnitario o preço que entrou na conta — o informado, ou o
     *                      sugerido pelo catálogo quando não veio
     * @param ajuste        com sinal
     */
    public record Valores(BigDecimal precoUnitario, BigDecimal subtotal, BigDecimal ajuste, BigDecimal total) {}
}
