package com.api.ero_api.localidade.service;

import com.api.ero_api.compartilhado.exception.ServicoIndisponivelException;
import com.api.ero_api.localidade.dtos.ViaCepRespostaDto;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.Optional;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Só o HTTP do ViaCEP. Proteções (OWASP A10, SSRF e abuso):
 * <ul>
 *   <li>host fixo, da configuração ({@code app.cep.url}, padrão {@code https://viacep.com.br/ws});
 *       nada da requisição do usuário entra na URL além do CEP já conferido com 8 dígitos;</li>
 *   <li>3 s para conectar e 3 s para responder;</li>
 *   <li>não segue redirecionamento (3xx = indisponível);</li>
 *   <li>limite de requisições próprio no {@code RateLimitFilter} ({@code /api/cep/});</li>
 *   <li>o CEP não vai para o log (com o número e a hora dá para saber onde alguém mora).</li>
 * </ul>
 */
@Service
public class ViaCepService {

    private static final Logger log = LoggerFactory.getLogger(ViaCepService.class);
    private static final Duration TEMPO_LIMITE = Duration.ofSeconds(3);
    private static final Pattern CEP = Pattern.compile("\\d{8}");
    private static final String MSG_INDISPONIVEL = "Consulta de CEP indisponível. Preencha o endereço à mão.";

    private final RestClient http;

    public ViaCepService(@Value("${app.cep.url:https://viacep.com.br/ws}") String url) {
        HttpClient cliente = HttpClient.newBuilder()
                .connectTimeout(TEMPO_LIMITE)
                .followRedirects(HttpClient.Redirect.NEVER)
                .version(HttpClient.Version.HTTP_1_1)
                .build();
        JdkClientHttpRequestFactory fabrica = new JdkClientHttpRequestFactory(cliente);
        fabrica.setReadTimeout(TEMPO_LIMITE);
        this.http = RestClient.builder().baseUrl(url).requestFactory(fabrica).build();
    }

    /**
     * @param cep8 só os 8 dígitos (quem chama já conferiu; aqui confere de novo antes de montar a URL)
     * @return vazio quando o CEP não existe ({@code erro: true})
     * @throws ServicoIndisponivelException falha de rede, tempo esgotado, redirecionamento ou resposta fora do 2xx
     */
    public Optional<ViaCepRespostaDto> consultar(String cep8) {
        if (cep8 == null || !CEP.matcher(cep8).matches()) {
            throw new IllegalArgumentException("CEP fora do formato de 8 dígitos.");
        }
        ViaCepRespostaDto resposta;
        try {
            resposta = http.get()
                    .uri("/{cep}/json/", cep8)
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .onStatus(status -> !status.is2xxSuccessful(), (req, res) -> {
                        log.warn("ViaCEP respondeu HTTP {}", res.getStatusCode().value());
                        throw new ServicoIndisponivelException(MSG_INDISPONIVEL);
                    })
                    .body(ViaCepRespostaDto.class);
        } catch (RestClientException e) {
            log.warn("Consulta de CEP falhou: {}", e.getClass().getSimpleName());
            throw new ServicoIndisponivelException(MSG_INDISPONIVEL);
        }
        if (resposta == null || Boolean.TRUE.equals(resposta.erro())) {
            return Optional.empty();
        }
        return Optional.of(resposta);
    }
}
