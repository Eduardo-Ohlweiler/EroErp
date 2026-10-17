package com.api.ero_erp.estoque.enums;

/**
 * O que moveu o saldo. Gravado como texto em {@code estoque_movimentacao.tipo};
 * o CHECK da migration 024 amarra o sinal da quantidade a cada um. SAIDA
 * entra quando houver venda ou consumo.
 */
public enum TipoMovimentacao {
    /** Positiva. Inclui o saldo inicial do cadastro. */
    ENTRADA,
    /** A diferença (nova − anterior), com o sinal dela. */
    AJUSTE,
    /** Negativa, na filial de origem. */
    TRANSFERENCIA_SAIDA,
    /** Positiva, na filial de destino. */
    TRANSFERENCIA_ENTRADA
}
