package com.api.ero_erp.localidade.cep;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/** Leitura da resposta do ViaCEP — o formato real, sem rede. */
@DisplayName("ViaCEP — leitura da resposta")
class ViaCepConsultaTest {

    private final ObjectMapper json = new ObjectMapper();

    @Test
    @DisplayName("CEP de logradouro")
    void logradouro() throws Exception {
        var r = ViaCepConsulta.deResposta(json.readTree("""
                {"cep":"90010-000","logradouro":"Rua dos Andradas","complemento":"até 1100 - lado par",
                 "bairro":"Centro Histórico","localidade":"Porto Alegre","uf":"RS","ibge":"4314902",
                 "gia":"","ddd":"51","siafi":"8801"}
                """));
        assertThat(r).hasValueSatisfying(e -> {
            assertThat(e.cep()).isEqualTo("90010000");
            assertThat(e.logradouro()).isEqualTo("Rua dos Andradas");
            assertThat(e.bairro()).isEqualTo("Centro Histórico");
            assertThat(e.codigoIbge()).isEqualTo(4314902);
            assertThat(e.uf()).isEqualTo("RS");
        });
    }

    @Test
    @DisplayName("CEP único: rua e bairro vazios")
    void cepUnico() throws Exception {
        var r = ViaCepConsulta.deResposta(json.readTree("""
                {"cep":"95800-000","logradouro":"","complemento":"","bairro":"",
                 "localidade":"Venâncio Aires","uf":"RS","ibge":"4322608"}
                """));
        assertThat(r).hasValueSatisfying(e -> {
            assertThat(e.logradouro()).isEmpty();
            assertThat(e.bairro()).isEmpty();
            assertThat(e.codigoIbge()).isEqualTo(4322608);
        });
    }

    @Test
    @DisplayName("CEP inexistente, nas duas formas que o ViaCEP usa")
    void inexistente() throws Exception {
        assertThat(ViaCepConsulta.deResposta(json.readTree("{\"erro\": true}"))).isEmpty();
        assertThat(ViaCepConsulta.deResposta(json.readTree("{\"erro\": \"true\"}"))).isEmpty();
    }
}
