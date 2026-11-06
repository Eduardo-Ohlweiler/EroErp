package com.api.ero_api.compartilhado.config;

import com.api.ero_api.seguranca.SecurityUtils;
import com.api.ero_api.seguranca.UsuarioAutenticado;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.auditing.DateTimeProvider;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Preenche created_at/updated_at/created_by/updated_by da BaseEntity.
 * "Quem" = usuário do token; em fluxos sem login (seed, login) fica vazio.
 */
@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorAtual", dateTimeProviderRef = "agoraUtc")
public class JpaAuditingConfig {

    @Bean
    AuditorAware<UUID> auditorAtual() {
        return () -> SecurityUtils.usuarioLogado().map(UsuarioAutenticado::usuarioId);
    }

    @Bean
    DateTimeProvider agoraUtc() {
        return () -> Optional.of(Instant.now());
    }
}
