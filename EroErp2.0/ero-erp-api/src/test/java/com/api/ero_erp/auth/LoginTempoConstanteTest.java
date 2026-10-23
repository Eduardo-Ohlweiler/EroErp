package com.api.ero_erp.auth;

import com.api.ero_erp.AbstractIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * E-mail inexistente custa o mesmo BCrypt que senha errada. Sem isso, a frase
 * é igual mas o tempo não: quem não existe volta em 1 ms, quem existe em
 * ~80 ms, e o cronômetro diz quais e-mails têm conta.
 *
 * <p>Classe à parte porque o espião troca o bean e abre outro contexto.
 */
@DisplayName("Login — tempo constante para e-mail inexistente")
class LoginTempoConstanteTest extends AbstractIntegrationTest {

    @MockitoSpyBean PasswordEncoder passwordEncoder;

    @Test
    @DisplayName("e-mail inexistente compara a senha uma vez, contra um hash do mesmo custo")
    void emailInexistenteCompararASenha() throws Exception {
        Mockito.clearInvocations(passwordEncoder);

        mockMvc.perform(post("/auth/login")
                        .contentType("application/json")
                        .content("""
                                {"email":"nao.existe@teste.local","senha":"qualquerSenha123"}
                                """))
                .andExpect(status().isUnauthorized());

        ArgumentCaptor<String> hash = ArgumentCaptor.forClass(String.class);
        verify(passwordEncoder, times(1)).matches(eq("qualquerSenha123"), hash.capture());

        // "$2a$12$" (BCryptPasswordEncoder(12)): versão e custo iguais aos de um usuário de verdade.
        String real = usuarioRepository.findById(adminA.getId()).orElseThrow().getSenha();
        assertThat(hash.getValue()).startsWith(real.substring(0, 7));
    }

    @Test
    @DisplayName("e-mail existente com senha errada também compara uma vez — a mesma conta")
    void emailExistenteCompararASenha() throws Exception {
        Mockito.clearInvocations(passwordEncoder);

        mockMvc.perform(post("/auth/login")
                        .contentType("application/json")
                        .content("""
                                {"email":"%s","senha":"qualquerSenha123"}
                                """.formatted(adminA.getEmail())))
                .andExpect(status().isUnauthorized());

        verify(passwordEncoder, times(1)).matches(eq("qualquerSenha123"), anyString());
    }
}
