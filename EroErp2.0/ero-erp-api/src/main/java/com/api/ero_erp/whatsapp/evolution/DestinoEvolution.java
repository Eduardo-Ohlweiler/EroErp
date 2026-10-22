package com.api.ero_erp.whatsapp.evolution;

/**
 * Para onde vai a chamada: o servidor global ou a sobrescrita da conexão.
 * {@code toString} não mostra a apikey — o record padrão a mostraria em
 * qualquer log ou exceção que o imprimisse.
 */
public record DestinoEvolution(String url, String apiKey) {

    @Override
    public String toString() {
        return "DestinoEvolution[url=" + url + "]";
    }
}
