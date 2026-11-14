package com.api.ero_api.compartilhado;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

import com.api.ero_api.compartilhado.exception.GlobalExceptionHandler;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Rota que mistura {@code @Valid @RequestBody} com restrição em parâmetro: o Spring
 * valida tudo junto e o erro do corpo chega como {@code HandlerMethodValidationException}
 * (não como {@code MethodArgumentNotValidException}). O {@code erros[].campo} tem que ser
 * o campo do DTO, como no 400 de corpo comum, e não o nome do parâmetro Java ("dto").
 * Nenhuma rota real mistura os dois hoje: o controller daqui é só do teste.
 */
class ValidacaoMistaTest {

    private final JsonMapper json = JsonMapper.builder().build();
    private final LocalValidatorFactoryBean validador = new LocalValidatorFactoryBean();
    private MockMvc mvc;

    @BeforeEach
    void preparar() {
        validador.afterPropertiesSet();
        mvc = MockMvcBuilders.standaloneSetup(new RotaMista())
                .setControllerAdvice(new GlobalExceptionHandler())
                .setValidator(validador)
                .build();
    }

    @AfterEach
    void limpar() {
        validador.close();
    }

    @Test
    void erroDoCorpoApontaOCampoDoDto() throws Exception {
        JsonNode erro = enviar("abc", """
                {"nome": "", "administrador": {"email": "sem-arroba"}}
                """);

        assertThat(erro.path("status").asInt()).isEqualTo(400);
        assertThat(erro.path("codigo").asString()).isEqualTo("VALIDACAO");
        assertThat(campos(erro)).containsExactlyInAnyOrder("nome", "administrador.email");
        assertThat(mensagem(erro, "administrador.email")).isEqualTo("E-mail inválido");
    }

    @Test
    void erroNoParametroENoCorpoJuntos() throws Exception {
        JsonNode erro = enviar("codigo-longo-demais", """
                {"nome": "", "administrador": {"email": "a@b.com"}}
                """);

        assertThat(campos(erro)).containsExactlyInAnyOrder("codigo", "nome");
        assertThat(mensagem(erro, "codigo")).isEqualTo("Código muito longo");
    }

    private JsonNode enviar(String codigo, String corpo) throws Exception {
        MvcResult r = mvc.perform(put("/teste/{codigo}", codigo)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo))
                .andReturn();
        assertThat(r.getResponse().getStatus()).isEqualTo(400);
        return json.readTree(r.getResponse().getContentAsString());
    }

    private static List<String> campos(JsonNode erro) {
        return erro.path("erros").valueStream().map(e -> e.path("campo").asString()).toList();
    }

    private static String mensagem(JsonNode erro, String campo) {
        return erro.path("erros").valueStream()
                .filter(e -> campo.equals(e.path("campo").asString()))
                .map(e -> e.path("mensagem").asString())
                .findFirst().orElse(null);
    }

    @RestController
    static class RotaMista {

        record AdministradorDto(@Email(message = "E-mail inválido") String email) {
        }

        record CorpoDto(@NotBlank(message = "Informe o nome") String nome,
                        @NotNull @Valid AdministradorDto administrador) {
        }

        @PutMapping("/teste/{codigo}")
        void salvar(@PathVariable @Size(max = 5, message = "Código muito longo") String codigo,
                    @Valid @RequestBody CorpoDto dto) {
            // Só para validar: nunca chega aqui nos testes.
        }
    }
}
