package com.api.ero_erp.exceptions;

import com.api.ero_erp.AbstractIntegrationTest;
import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.usuario.enums.Role;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Regra 5: log leva id e operação, nunca dado pessoal nem segredo.
 *
 * <p>Dois vazamentos que o handler tinha: a violação de integridade era
 * logada com a exceção inteira, e o Postgres põe no Detail o valor que
 * colidiu ({@code Key (email)=(...) already exists}); e o caminho do webhook
 * do WhatsApp, cujo segredo é a credencial, ia para o log em todo erro.
 */
@ExtendWith(OutputCaptureExtension.class)
@DisplayName("Log sem dado pessoal nem segredo")
class LogSemDadoPessoalTest extends AbstractIntegrationTest {

    private static final String EMAIL = "duplicado.lgpd@teste.local";
    private static final String SEGREDO = "segredo-teste-123";

    @Autowired GlobalExceptionHandler handler;

    @Test
    @DisplayName("violação de integridade: log com a constraint e o SQLState, sem o valor que colidiu")
    void integridadeSemOValor(CapturedOutput saida) {
        criarUsuario(tenantA, EMAIL, Role.USER);

        Usuario repetido = new Usuario();
        repetido.setTenant(tenantB);
        repetido.setNome("Outro com o mesmo e-mail");
        repetido.setEmail(EMAIL);
        repetido.setSenha(passwordEncoder.encode(SENHA_PADRAO));
        repetido.setRole(Role.USER);

        DataIntegrityViolationException erro = (DataIntegrityViolationException) org.assertj.core.api.Assertions
                .catchThrowable(() -> usuarioRepository.saveAndFlush(repetido));
        assertThat(erro).isNotNull();

        int inicio = saida.length();
        handler.integridade(erro, new MockHttpServletRequest("POST", "/usuarios"));
        String doHandler = saida.toString().substring(inicio);

        assertThat(doHandler)
                .contains("uk_usuario_email")
                .contains("23505")
                .doesNotContain(EMAIL)
                .as("sem a exceção: a mensagem dela é onde o driver põe o valor")
                .doesNotContain("PSQLException");

        // E o próprio Hibernate, que loga o erro do driver, também não o leva:
        // logServerErrorDetail=false tira o Detail da mensagem na origem.
        assertThat(saida.toString()).doesNotContain(EMAIL);
    }

    @Test
    @DisplayName("erro no webhook do WhatsApp: o segredo do caminho não vai para o log")
    void webhookSemOSegredo(CapturedOutput saida) {
        String uri = "/integracoes/whatsapp/webhook/" + SEGREDO;

        handler.inesperado(new IllegalStateException("falha qualquer"), new MockHttpServletRequest("POST", uri));
        handler.acessoNegado(new org.springframework.security.access.AccessDeniedException("x"),
                new MockHttpServletRequest("POST", uri));

        assertThat(saida.toString())
                .contains("/integracoes/whatsapp/webhook/***")
                .doesNotContain(SEGREDO);
    }
}
