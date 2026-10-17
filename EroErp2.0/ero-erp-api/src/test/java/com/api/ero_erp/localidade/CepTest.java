package com.api.ero_erp.localidade;

import com.api.ero_erp.AbstractIntegrationTest;
import com.api.ero_erp.exceptions.ServicoIndisponivelException;
import com.api.ero_erp.localidade.cep.ConsultaCep;
import com.api.ero_erp.localidade.cep.EnderecoDoCep;
import com.api.ero_erp.localidade.repository.CidadeRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.http.HttpHeaders.AUTHORIZATION;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Endereço pelo CEP. O provedor externo é substituído — o teste não depende
 * de rede —, e o que se confere é o que é nosso: a cidade achada pelo código
 * do IBGE, o CEP único, e as respostas de erro que a tela mostra inline.
 */
@DisplayName("Consulta de CEP")
class CepTest extends AbstractIntegrationTest {

    private static final int IBGE_PORTO_ALEGRE = 4314902;
    private static final int IBGE_VENANCIO_AIRES = 4322608;

    @MockitoBean ConsultaCep consultaCep;
    @Autowired CidadeRepository cidadeRepository;

    @Test
    @DisplayName("CEP de logradouro traz rua, bairro e a cidade da tabela IBGE")
    void cepDeLogradouro() throws Exception {
        when(consultaCep.consultar("90010000")).thenReturn(Optional.of(
                new EnderecoDoCep("90010000", "Rua dos Andradas", "Centro Histórico", IBGE_PORTO_ALEGRE, "RS")));
        String portoAlegre = cidadeRepository.findByCodigoIbge(IBGE_PORTO_ALEGRE).orElseThrow().getId().toString();

        mockMvc.perform(get("/cep/{cep}", "90010-000").header(AUTHORIZATION, autenticar(adminA.getEmail())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cep").value("90010000"))
                .andExpect(jsonPath("$.logradouro").value("Rua dos Andradas"))
                .andExpect(jsonPath("$.bairro").value("Centro Histórico"))
                .andExpect(jsonPath("$.cidadeId").value(portoAlegre))
                .andExpect(jsonPath("$.cidadeNome").value("Porto Alegre"))
                .andExpect(jsonPath("$.estadoSigla").value("RS"))
                .andExpect(jsonPath("$.cepUnico").value(false));
    }

    @Test
    @DisplayName("CEP único da cidade traz só a cidade, marcado como único")
    void cepUnico() throws Exception {
        when(consultaCep.consultar("95800000")).thenReturn(Optional.of(
                new EnderecoDoCep("95800000", "", "", IBGE_VENANCIO_AIRES, "RS")));

        mockMvc.perform(get("/cep/{cep}", "95800000").header(AUTHORIZATION, autenticar(adminA.getEmail())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cidadeNome").value("Venâncio Aires"))
                .andExpect(jsonPath("$.logradouro").value(""))
                .andExpect(jsonPath("$.bairro").value(""))
                .andExpect(jsonPath("$.cepUnico").value(true));
    }

    @Test
    @DisplayName("município fora da tabela volta sem cidade e com o motivo")
    void cidadeForaDaTabela() throws Exception {
        when(consultaCep.consultar("99999999")).thenReturn(Optional.of(
                new EnderecoDoCep("99999999", "Rua Qualquer", "Bairro", 9999999, "RS")));

        mockMvc.perform(get("/cep/{cep}", "99999999").header(AUTHORIZATION, autenticar(adminA.getEmail())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cidadeId").doesNotExist())
                .andExpect(jsonPath("$.logradouro").value("Rua Qualquer"))
                .andExpect(jsonPath("$.motivo").isNotEmpty());
    }

    @Test
    @DisplayName("CEP sem 8 dígitos é 400 e nem chega ao provedor")
    void cepCurto() throws Exception {
        mockMvc.perform(get("/cep/{cep}", "9001000").header(AUTHORIZATION, autenticar(adminA.getEmail())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value("CEP deve ter 8 dígitos"));
        verify(consultaCep, never()).consultar(anyString());
    }

    @Test
    @DisplayName("CEP inexistente é 404")
    void cepInexistente() throws Exception {
        when(consultaCep.consultar("00000000")).thenReturn(Optional.empty());

        mockMvc.perform(get("/cep/{cep}", "00000-000").header(AUTHORIZATION, autenticar(adminA.getEmail())))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.erro").value("CEP não encontrado"));
    }

    @Test
    @DisplayName("provedor fora do ar é 503, não 500")
    void provedorForaDoAr() throws Exception {
        when(consultaCep.consultar("90010000"))
                .thenThrow(new ServicoIndisponivelException("Consulta de CEP indisponível no momento"));

        mockMvc.perform(get("/cep/{cep}", "90010000").header(AUTHORIZATION, autenticar(adminA.getEmail())))
                .andExpect(status().isServiceUnavailable());
    }

    @Test
    @DisplayName("sem login é 401")
    void semLogin() throws Exception {
        mockMvc.perform(get("/cep/{cep}", "90010000"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("USER sem nenhuma permissão consulta CEP — serve qualquer tela de endereço")
    void userSemPermissao() throws Exception {
        when(consultaCep.consultar("95800000")).thenReturn(Optional.of(
                new EnderecoDoCep("95800000", "", "", IBGE_VENANCIO_AIRES, "RS")));

        mockMvc.perform(get("/cep/{cep}", "95800000").header(AUTHORIZATION, autenticar(userA.getEmail())))
                .andExpect(status().isOk());
    }
}
