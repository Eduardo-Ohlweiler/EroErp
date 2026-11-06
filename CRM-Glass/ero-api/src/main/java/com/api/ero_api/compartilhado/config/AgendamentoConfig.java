package com.api.ero_api.compartilhado.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Liga os jobs {@code @Scheduled} (ex.: retenção da trilha de segurança).
 * Com várias instâncias, cada uma roda o job: ele é idempotente (só DELETE por data).
 */
@Configuration
@EnableScheduling
public class AgendamentoConfig {
}
