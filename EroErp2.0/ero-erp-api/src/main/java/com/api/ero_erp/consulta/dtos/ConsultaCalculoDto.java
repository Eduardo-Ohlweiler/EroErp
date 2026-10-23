package com.api.ero_erp.consulta.dtos;

import java.math.BigDecimal;
import java.util.List;

/**
 * Os totais de um corpo de consulta, sem gravar. Os itens vêm na ordem em
 * que foram mandados; uma lista que não veio (e não estava gravada) volta
 * vazia.
 *
 * <p>Para quem não lê Serviços (ou Produtos), a lista correspondente sai
 * ausente, como no {@code ConsultaResponseDto}; os subtotais e o total saem
 * sempre, contados com os itens gravados.
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
