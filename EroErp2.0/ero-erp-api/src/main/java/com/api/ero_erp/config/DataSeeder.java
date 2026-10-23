package com.api.ero_erp.config;

import com.api.ero_erp.config.validacao.SenhaBcryptValidator;
import com.api.ero_erp.tenant.entity.Tenant;
import com.api.ero_erp.tenant.repository.TenantRepository;
import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.usuario.enums.Role;
import com.api.ero_erp.usuario.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements ApplicationRunner {

    private final TenantRepository tenantRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.superadmin.tenant-nome}")
    private String tenantNome;

    @Value("${app.superadmin.nome}")
    private String nome;

    @Value("${app.superadmin.email}")
    private String email;

    @Value("${app.superadmin.senha}")
    private String senha;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (usuarioRepository.existsByRole(Role.SUPERADMIN)) {
            log.debug("Superadmin já existe — seeding ignorado");
            return;
        }

        validarConfiguracao();

        Tenant tenantRaiz = tenantRepository.save(new Tenant(tenantNome));

        Usuario superadmin = new Usuario();
        superadmin.setTenant(tenantRaiz);
        superadmin.setNome(nome);
        superadmin.setEmail(email.trim().toLowerCase());
        superadmin.setSenha(passwordEncoder.encode(senha));
        superadmin.setRole(Role.SUPERADMIN);
        usuarioRepository.save(superadmin);

        log.info("Tenant raiz '{}' e superadmin criados na primeira subida", tenantNome);
    }

    private void validarConfiguracao() {
        exigir(nome, "SUPERADMIN_NAME");
        exigir(email, "SUPERADMIN_EMAIL");
        exigir(senha, "SUPERADMIN_PASSWORD");

        if (senha.length() < 10)
            throw new IllegalStateException("SUPERADMIN_PASSWORD precisa de no mínimo 10 caracteres");

        // O encoder recusaria com "password cannot be more than 72 bytes" no
        // meio do boot; aqui a frase diz qual variável e por quê.
        if (!SenhaBcryptValidator.cabe(senha))
            throw new IllegalStateException("SUPERADMIN_PASSWORD passa de 72 bytes em UTF-8 "
                    + "(letras acentuadas e símbolos ocupam 2 ou mais): use menos caracteres");
    }

    private void exigir(String valor, String variavel) {
        if (valor == null || valor.isBlank())
            throw new IllegalStateException("Variável de ambiente obrigatória não definida: " + variavel);
    }
}
