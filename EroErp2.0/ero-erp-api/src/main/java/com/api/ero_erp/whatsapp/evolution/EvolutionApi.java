package com.api.ero_erp.whatsapp.evolution;

/**
 * A Evolution API (v2), do jeito que o sistema a usa. Interface para que os
 * testes não dependam de rede ({@code @MockitoBean}), como o
 * {@code ConsultaCep}.
 *
 * <p>Toda chamada recebe o destino: o servidor é global, mas a conexão pode
 * sobrescrevê-lo. Toda falha de rede, de chave ou do servidor sai como
 * {@link com.api.ero_erp.exceptions.ServicoIndisponivelException}, com a
 * frase que a tela mostra.
 */
public interface EvolutionApi {

    /**
     * Cria a instância se ela ainda não existe no servidor. Idempotente:
     * chamar de novo não faz nada.
     */
    void criarInstancia(DestinoEvolution destino, String instancia);

    /** Pede o QR. Com a instância já conectada, volta vazio ({@link QrCodeEvolution#jaConectada}). */
    QrCodeEvolution conectar(DestinoEvolution destino, String instancia);

    /** O estado agora. Instância que o servidor não conhece está desconectada. */
    EstadoEvolution estadoConexao(DestinoEvolution destino, String instancia);

    /** Aponta o evento de conexão para {@code url}. Idempotente. */
    void configurarWebhook(DestinoEvolution destino, String instancia, String url);

    /** Desliga o aparelho da instância. Instância já desligada não é erro. */
    void logout(DestinoEvolution destino, String instancia);

    /** Apaga a instância do servidor. Instância que não existe não é erro. */
    void excluirInstancia(DestinoEvolution destino, String instancia);

    /**
     * Envia um texto — a fila de envio (Fase 4) é quem chama.
     *
     * @param numero só dígitos, com DDI
     */
    void enviarTexto(DestinoEvolution destino, String instancia, String numero, String texto);
}
