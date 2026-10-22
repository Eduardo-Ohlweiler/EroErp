package com.api.ero_erp.whatsapp.enums;

/**
 * O último estado visto da instância na Evolution — pelo webhook ou pela
 * consulta que a tela faz. É retrato, não verdade: a tela consulta de novo.
 */
public enum StatusConexao {
    DESCONECTADO,
    /** QR gerado, esperando o celular ler. A Evolution chama de "connecting". */
    AGUARDANDO_QR,
    CONECTADO
}
