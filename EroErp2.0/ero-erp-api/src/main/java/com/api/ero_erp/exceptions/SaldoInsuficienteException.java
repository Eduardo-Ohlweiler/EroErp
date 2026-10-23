package com.api.ero_erp.exceptions;

/**
 * A recusa da baixa por falta de saldo — um 409 como os outros, com tipo
 * próprio para quem precisa distinguir: a consulta troca a frase (que nomeia o
 * produto e diz o saldo) para quem não lê Produtos.
 */
public class SaldoInsuficienteException extends ConflictException {

    public SaldoInsuficienteException(String mensagem) {
        super(mensagem);
    }
}
