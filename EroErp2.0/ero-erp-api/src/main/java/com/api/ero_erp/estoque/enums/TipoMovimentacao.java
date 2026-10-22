package com.api.ero_erp.estoque.enums;

/**
 * O que moveu o saldo. Gravado como texto em {@code estoque_movimentacao.tipo};
 * o CHECK das migrations 024 e 027 amarra o sinal da quantidade a cada um.
 * A saída por venda entra quando houver venda.
 */
public enum TipoMovimentacao {
    /** Positiva. Inclui o saldo inicial do cadastro. */
    ENTRADA,
    /** A diferença (nova − anterior), com o sinal dela. */
    AJUSTE,
    /** Negativa, na filial de origem. */
    TRANSFERENCIA_SAIDA,
    /** Positiva, na filial de destino. */
    TRANSFERENCIA_ENTRADA,
    /** Negativa, na filial do compromisso, ao concluir a consulta. Não tem estorno. */
    SAIDA_CONSULTA
}
