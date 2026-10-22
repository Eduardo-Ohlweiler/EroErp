package com.api.ero_erp.whatsapp.evolution;

import com.api.ero_erp.whatsapp.enums.StatusConexao;

/**
 * @param numero só dígitos, com DDI; só vem quando conectado, e nem sempre
 *               (a Evolution pode não saber ainda)
 */
public record EstadoEvolution(StatusConexao status, String numero) {

    /**
     * {@code open} · {@code connecting} · {@code close}, como a Evolution
     * escreve no {@code connectionState} e no {@code connection.update}.
     * Estado que não reconhecemos é desconectado: é o que impede o envio.
     */
    public static StatusConexao statusDe(String estado) {
        if (estado == null) return StatusConexao.DESCONECTADO;
        return switch (estado.trim().toLowerCase()) {
            case "open" -> StatusConexao.CONECTADO;
            case "connecting" -> StatusConexao.AGUARDANDO_QR;
            default -> StatusConexao.DESCONECTADO;
        };
    }

    /**
     * {@code 5551999998888@s.whatsapp.net} ou {@code 5551999998888:12@s.whatsapp.net}
     * (o sufixo é o aparelho) → {@code 5551999998888}. Vazio vira nulo.
     */
    public static String numeroDe(String jid) {
        if (jid == null) return null;
        String digitos = jid.replaceAll("[@:].*$", "").replaceAll("\\D", "");
        return digitos.isEmpty() ? null : digitos;
    }
}
