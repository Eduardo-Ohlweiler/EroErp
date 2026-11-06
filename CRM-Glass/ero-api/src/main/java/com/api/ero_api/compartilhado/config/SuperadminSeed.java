package com.api.ero_api.compartilhado.config;

import com.api.ero_api.compartilhado.exception.RegraNegocioException;
import com.api.ero_api.compartilhado.util.LogSeguro;
import com.api.ero_api.seguranca.tenant.TenantContext;
import com.api.ero_api.usuario.service.UsuarioService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Cria o superadmin na primeira subida, a partir das variáveis
 * SUPERADMIN_EMAIL / SUPERADMIN_SENHA / SUPERADMIN_NOME. Se já existe um, não faz nada.
 * A senha nunca vai para o log.
 */
@Component
public class SuperadminSeed implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SuperadminSeed.class);

    private final UsuarioService usuarioService;
    private final TransactionTemplate tx;
    private final String email;
    private final String senha;
    private final String nome;

    public SuperadminSeed(UsuarioService usuarioService, PlatformTransactionManager transactionManager,
                          @Value("${app.superadmin.email:}") String email,
                          @Value("${app.superadmin.senha:}") String senha,
                          @Value("${app.superadmin.nome:Superadmin}") String nome) {
        this.usuarioService = usuarioService;
        this.tx = new TransactionTemplate(transactionManager);
        this.email = email;
        this.senha = senha;
        this.nome = nome;
    }

    @Override
    public void run(ApplicationArguments args) {
        TenantContext.comoRoot(() -> tx.execute(s -> {
            if (usuarioService.existeSuperadmin()) {
                return null;
            }
            if (email.isBlank() || senha.isBlank()) {
                log.warn("Nenhum superadmin no banco e SUPERADMIN_EMAIL/SUPERADMIN_SENHA não configurados.");
                return null;
            }
            try {
                usuarioService.criarSuperadmin(nome, email, senha);
            } catch (RegraNegocioException e) {
                throw new IllegalStateException("SUPERADMIN_SENHA/EMAIL recusados: " + e.getMessage(), e);
            }
            log.info("Superadmin criado: {}", LogSeguro.email(email));
            return null;
        }));
    }
}
