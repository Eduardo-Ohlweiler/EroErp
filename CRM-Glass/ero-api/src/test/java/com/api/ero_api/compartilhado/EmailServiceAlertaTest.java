package com.api.ero_api.compartilhado;

import static org.assertj.core.api.Assertions.assertThat;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.api.ero_api.compartilhado.email.EmailService;
import com.api.ero_api.support.CaixaDeEmailFake;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.support.StaticListableBeanFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mock.env.MockEnvironment;

/**
 * SMTP fora do ar: nem o código nem um e-mail de alerta chegariam, então o alerta é
 * um log de erro (o monitoramento procura "alerta smtp_falhas_seguidas"). Um por
 * janela de 10 minutos, sem e-mail nem id no texto.
 */
class EmailServiceAlertaTest {

    private static final String ALERTA = "alerta smtp_falhas_seguidas";
    private static final String DESTINO = "pessoa.sigilosa@teste.local";

    private final CaixaDeEmailFake caixa = new CaixaDeEmailFake();
    private final ListAppender<ILoggingEvent> logs = new ListAppender<>();
    private final Logger logger = (Logger) LoggerFactory.getLogger(EmailService.class);
    private final RelogioDeTeste relogio = new RelogioDeTeste(Instant.parse("2026-11-13T12:00:00Z"));
    private EmailService email;

    @BeforeEach
    void preparar() {
        StaticListableBeanFactory beans = new StaticListableBeanFactory(Map.of("mail", caixa, "relogio", relogio));
        email = new EmailService(beans.getBeanProvider(JavaMailSender.class), "nao-responda@teste.local", "CRM Glass",
                new MockEnvironment(), beans.getBeanProvider(Clock.class));
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
    void cincoFalhasSeguidasGeramUmAlertaSoPorJanela() {
        caixa.falharEnvios(true);
        enviar(4);
        assertThat(alertas()).as("4 falhas ainda não").isEmpty();

        enviar(1);
        assertThat(alertas()).hasSize(1);
        ILoggingEvent alerta = alertas().get(0);
        assertThat(alerta.getLevel()).isEqualTo(Level.ERROR);
        assertThat(alerta.getFormattedMessage()).isEqualTo("alerta smtp_falhas_seguidas=5 janela=10m");

        enviar(10);
        assertThat(alertas()).as("um alerta só dentro dos mesmos 10 minutos").hasSize(1);
        assertThat(logs.list).extracting(ILoggingEvent::getFormattedMessage).noneMatch(m -> m.contains(DESTINO));
    }

    @Test
    void envioQueSaiZeraASequencia() {
        caixa.falharEnvios(true);
        enviar(4);
        caixa.falharEnvios(false);
        enviar(1);
        caixa.falharEnvios(true);
        enviar(4);
        assertThat(alertas()).as("4 + 4 com um sucesso no meio não são seguidas").isEmpty();
    }

    /** Passados os 10 minutos, a nova sequência de 5 falhas gera outro alerta. */
    @Test
    void outraJanelaGeraOutroAlerta() {
        caixa.falharEnvios(true);
        enviar(5);
        relogio.avancar(Duration.ofMinutes(11));
        enviar(5);
        assertThat(alertas()).hasSize(2);
    }

    /** Falha de mais de 10 minutos atrás não soma com as de agora. */
    @Test
    void falhasAntigasSaemDaJanela() {
        caixa.falharEnvios(true);
        enviar(4);
        relogio.avancar(Duration.ofMinutes(11));
        enviar(4);
        assertThat(alertas()).as("4 antigas + 4 novas não são 5 em 10 minutos").isEmpty();

        enviar(1);
        assertThat(alertas()).as("5 dentro da janela").hasSize(1);
        assertThat(alertas().get(0).getFormattedMessage()).isEqualTo("alerta smtp_falhas_seguidas=5 janela=10m");
    }

    private void enviar(int vezes) {
        for (int i = 0; i < vezes; i++) {
            email.enviarCodigoVerificacao(DESTINO, "Pessoa", "123456", Duration.ofMinutes(10));
        }
    }

    private List<ILoggingEvent> alertas() {
        return logs.list.stream().filter(e -> e.getFormattedMessage().startsWith(ALERTA)).toList();
    }

    /** Relógio parado que o teste adianta à mão (sem esperar 10 minutos de verdade). */
    private static final class RelogioDeTeste extends Clock {

        private Instant agora;

        RelogioDeTeste(Instant inicio) {
            this.agora = inicio;
        }

        void avancar(Duration tempo) {
            agora = agora.plus(tempo);
        }

        @Override
        public Instant instant() {
            return agora;
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }
    }
}
