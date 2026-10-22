package com.api.ero_erp.consulta.service;

import com.api.ero_erp.consulta.enums.TipoAjuste;
import com.api.ero_erp.consulta.enums.TipoCalculo;
import com.api.ero_erp.exceptions.BadRequestException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;

/**
 * A conta da consulta — a única. O salvar, a prévia ({@code /consultas/calculo})
 * e a resposta passam todos por aqui, e a tela mostra o que vem publicado em
 * vez de refazer a conta.
 *
 * <p>Por item: {@code subtotal = quantidade × preço}, {@code ajuste} com sinal
 * (desconto negativo, acréscimo positivo) e {@code total = subtotal + ajuste}.
 * Na consulta: a soma dos totais dos itens, o ajuste geral sobre ela e
 * {@code total = subtotal + ajusteGeral}. Tudo em 2 casas, HALF_UP, a cada
 * passo — o número que se lê é o que entra na soma.
 */
public final class CalculoConsulta {

    private static final BigDecimal CEM = BigDecimal.valueOf(100);

    private CalculoConsulta() {}

    /**
     * Um ajuste já conferido: tipo, cálculo e valor juntos, valor maior que
     * zero, percentual até 100.
     */
    public record Ajuste(TipoAjuste tipo, TipoCalculo calculo, BigDecimal valor) {

        /**
         * Nulo quando os três vêm vazios. {@code alvo} entra na frase:
         * "Ajuste de Limpeza: …", "Ajuste geral: …".
         */
        public static Ajuste de(String alvo, TipoAjuste tipo, TipoCalculo calculo, BigDecimal valor) {
            if (tipo == null && calculo == null && valor == null) return null;
            if (tipo == null || calculo == null || valor == null) {
                throw new BadRequestException("Ajuste " + alvo + ": informe o tipo, o cálculo e o valor juntos");
            }
            if (valor.signum() <= 0) {
                throw new BadRequestException("Ajuste " + alvo + ": o valor tem de ser maior que zero");
            }
            if (calculo == TipoCalculo.PERCENTUAL && valor.compareTo(CEM) > 0) {
                throw new BadRequestException("Ajuste " + alvo + ": o percentual vai até 100");
            }
            return new Ajuste(tipo, calculo, valor);
        }
    }

    /** Um item como entra na conta. A descrição só serve para nomeá-lo na recusa. */
    public record Linha(String descricao, BigDecimal quantidade, BigDecimal precoUnitario, Ajuste ajuste) {}

    /** O que se publica de cada item. {@code ajuste} tem sinal. */
    public record Valores(BigDecimal subtotal, BigDecimal ajuste, BigDecimal total) {}

    public record Resultado(List<Valores> servicos,
                            List<Valores> produtos,
                            BigDecimal subtotalServicos,
                            BigDecimal subtotalProdutos,
                            BigDecimal subtotal,
                            BigDecimal ajusteGeral,
                            BigDecimal total) {}

    public static Resultado calcular(List<Linha> servicos, List<Linha> produtos, Ajuste geral) {
        List<Valores> dosServicos = servicos.stream().map(CalculoConsulta::item).toList();
        List<Valores> dosProdutos = produtos.stream().map(CalculoConsulta::item).toList();
        BigDecimal subtotalServicos = somar(dosServicos);
        BigDecimal subtotalProdutos = somar(dosProdutos);
        BigDecimal subtotal = subtotalServicos.add(subtotalProdutos);
        BigDecimal ajusteGeral = ajuste(subtotal, geral, "Desconto geral passa do subtotal");
        return new Resultado(dosServicos, dosProdutos, subtotalServicos, subtotalProdutos, subtotal,
                ajusteGeral, subtotal.add(ajusteGeral));
    }

    private static Valores item(Linha linha) {
        BigDecimal subtotal = dinheiro(linha.quantidade().multiply(linha.precoUnitario()));
        BigDecimal ajuste = ajuste(subtotal, linha.ajuste(),
                "Desconto de " + linha.descricao() + " passa do valor do item");
        return new Valores(subtotal, ajuste, subtotal.add(ajuste));
    }

    /** O ajuste em dinheiro, com sinal. O desconto não passa da base: o total não fica negativo. */
    private static BigDecimal ajuste(BigDecimal base, Ajuste ajuste, String frasePassou) {
        if (ajuste == null) return dinheiro(BigDecimal.ZERO);
        BigDecimal valor = ajuste.calculo() == TipoCalculo.PERCENTUAL
                ? dinheiro(base.multiply(ajuste.valor()).divide(CEM, 10, RoundingMode.HALF_UP))
                : dinheiro(ajuste.valor());
        if (ajuste.tipo() == TipoAjuste.ACRESCIMO) return valor;
        if (valor.compareTo(base) > 0) {
            throw new BadRequestException(frasePassou + " (" + reais(base) + ")");
        }
        return valor.negate();
    }

    private static BigDecimal somar(List<Valores> valores) {
        return valores.stream().map(Valores::total).reduce(dinheiro(BigDecimal.ZERO), BigDecimal::add);
    }

    private static BigDecimal dinheiro(BigDecimal valor) {
        return valor.setScale(2, RoundingMode.HALF_UP);
    }

    private static String reais(BigDecimal valor) {
        return NumberFormat.getCurrencyInstance(Locale.of("pt", "BR")).format(valor).replace(' ', ' ');
    }
}
