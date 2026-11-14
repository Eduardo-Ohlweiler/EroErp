package com.api.ero_api.auth;

import static org.assertj.core.api.Assertions.assertThat;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.api.ero_api.auth.service.CodigoVerificacaoService;
import com.api.ero_api.seguranca.config.SegurancaProperties;
import java.time.Duration;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.mock.env.MockEnvironment;

/**
 * {@code app.seguranca.codigo-max-emissoes-por-hora}: teto de 1000 (o modo Mailpit de
 * dev) e, acima do valor de produção (10) fora de dev/test, ERRO no log na subida,
 * como o aviso de SMTP sem STARTTLS. A aplicação sobe mesmo assim.
 */
class LimiteEmissaoConfiguracaoTest {

    private final ListAppender<ILoggingEvent> logs = new ListAppender<>();
    private final Logger logger = (Logger) LoggerFactory.getLogger(CodigoVerificacaoService.class);

    @BeforeEach
    void preparar() {
        logs.start();
        logger.addAppender(logs);
        logger.setLevel(Level.INFO);
    }

    @AfterEach
    void limpar() {
        logger.detachAppender(logs);
        logger.setLevel(null);
    }

    @Test
    void acimaDoPadraoForaDeDevETesteViraErro() {
        subir(1000, "prod");
        assertThat(niveis()).containsExactly(Level.ERROR);
        assertThat(logs.list.get(0).getFormattedMessage()).contains("1000").contains("APP_CODIGO_MAX_EMISSOES_POR_HORA");
    }

    @Test
    void emDevSoAvisa() {
        subir(1000, "dev");
        assertThat(niveis()).containsExactly(Level.WARN);
    }

    @Test
    void padraoDeProducaoNaoAvisa() {
        subir(10, "prod");
        assertThat(logs.list).isEmpty();
    }

    @Test
    void acimaDoTetoNaoSobe() {
        ApplicationContextRunner contexto = new ApplicationContextRunner()
                .withUserConfiguration(SoAsPropriedades.class)
                .withPropertyValues("app.seguranca.jwt-segredo=segredo", "app.seguranca.cripto-chave=chave");

        contexto.withPropertyValues("app.seguranca.codigo-max-emissoes-por-hora=1001").run(ctx -> {
            assertThat(ctx).hasFailed();
            assertThat(ctx.getStartupFailure()).hasStackTraceContaining("codigoMaxEmissoesPorHora");
        });
        contexto.withPropertyValues("app.seguranca.codigo-max-emissoes-por-hora=1000").run(ctx ->
                assertThat(ctx.getBean(SegurancaProperties.class).codigoMaxEmissoesPorHora()).isEqualTo(1000));
    }

    /** Só o construtor importa aqui: ele confere o limite e não usa as outras dependências. */
    private static void subir(int limite, String perfil) {
        SegurancaProperties props = new SegurancaProperties("segredo", "chave", Duration.ofMinutes(15), Duration.ofDays(7),
                Duration.ofMinutes(10), true, "default-src 'none'", List.of(), 5, Duration.ofMinutes(15),
                Duration.ofSeconds(10), Duration.ofSeconds(60), 5, limite);
        MockEnvironment ambiente = new MockEnvironment();
        ambiente.setActiveProfiles(perfil);
        new CodigoVerificacaoService(null, null, null, null, null, props, null, ambiente);
    }

    private List<Level> niveis() {
        return logs.list.stream().map(ILoggingEvent::getLevel).toList();
    }

    @Configuration(proxyBeanMethods = false)
    @EnableConfigurationProperties(SegurancaProperties.class)
    static class SoAsPropriedades {
    }
}
