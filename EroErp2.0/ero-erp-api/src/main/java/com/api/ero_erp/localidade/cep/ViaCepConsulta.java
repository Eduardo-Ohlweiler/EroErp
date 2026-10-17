package com.api.ero_erp.localidade.cep;

import com.api.ero_erp.exceptions.ServicoIndisponivelException;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Duration;
import java.util.Optional;

/**
 * CEP pelo ViaCEP — gratuito, sem chave, e devolve o código IBGE do
 * município, que casa com a tabela {@code cidade} sem comparar nomes.
 *
 * <p>Timeout curto: a consulta acontece enquanto o usuário digita, e um
 * provedor lento não pode prender a tela — ele preenche à mão.
 *
 * <p>O CEP não vai para o log: endereço é dado pessoal (regra 5).
 */
@Component
@Slf4j
public class ViaCepConsulta implements ConsultaCep {

    private static final Duration TIMEOUT = Duration.ofSeconds(3);

    private final RestClient http;

    public ViaCepConsulta(RestClient.Builder builder,
                          @Value("${app.cep.url:https://viacep.com.br/ws}") String url) {
        SimpleClientHttpRequestFactory fabrica = new SimpleClientHttpRequestFactory();
        fabrica.setConnectTimeout(TIMEOUT);
        fabrica.setReadTimeout(TIMEOUT);
        this.http = builder.baseUrl(url).requestFactory(fabrica).build();
    }

    @Override
    public Optional<EnderecoDoCep> consultar(String cep) {
        try {
            JsonNode corpo = http.get().uri("/{cep}/json/", cep).retrieve().body(JsonNode.class);
            return deResposta(corpo);
        } catch (RestClientException e) {
            log.warn("ViaCEP indisponível: {}", e.getClass().getSimpleName());
            throw new ServicoIndisponivelException("Consulta de CEP indisponível no momento. Preencha o endereço à mão");
        }
    }

    /**
     * Resposta do ViaCEP → endereço. CEP inexistente volta {@code {"erro": true}}
     * (ou {@code "true"}, nas versões mais novas): vazio.
     */
    static Optional<EnderecoDoCep> deResposta(JsonNode corpo) {
        if (corpo == null || corpo.path("erro").asBoolean(false)) {
            return Optional.empty();
        }
        String ibge = texto(corpo, "ibge");
        return Optional.of(new EnderecoDoCep(
                texto(corpo, "cep").replaceAll("\\D", ""),
                texto(corpo, "logradouro"),
                texto(corpo, "bairro"),
                ibge.isEmpty() ? null : Integer.valueOf(ibge),
                texto(corpo, "uf")));
    }

    private static String texto(JsonNode corpo, String campo) {
        return corpo.path(campo).asText("").trim();
    }
}
