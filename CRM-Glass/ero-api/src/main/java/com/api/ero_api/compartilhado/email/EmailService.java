package com.api.ero_api.compartilhado.email;

import com.api.ero_api.compartilhado.util.LogSeguro;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Properties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

/**
 * Envio de e-mail por SMTP ({@code spring.mail.*}; em dev, Gmail com senha de app
 * vinda do {@code .env}). Envio síncrono: quem chama faz isso DEPOIS do commit, para
 * não segurar conexão do banco enquanto o SMTP responde (timeouts de 10 s no YAML).
 *
 * <p>Nunca lança: devolve {@code false} quando não enviou. O conteúdo da mensagem
 * (código!) não vai para o log; a falha é logada com o e-mail mascarado.
 *
 * <p>Sem SMTP configurado a aplicação sobe com um aviso e todo envio devolve
 * {@code false} (o login responde 503).
 *
 * <p>Modelos em {@code resources/templates/email/}: HTML simples com estilos inline
 * (cliente de e-mail não lê CSS externo), sem imagens nem scripts, e marcadores
 * entre chaves duplas trocados por {@code String.replace} com o valor já escapado.
 * Toda mensagem leva também a versão em texto puro.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final String MODELO_CODIGO = "templates/email/codigo-verificacao.html";

    private final JavaMailSender mailSender;
    private final String remetente;
    private final String remetenteNome;
    private final String modeloCodigo;
    private final boolean configurado;

    public EmailService(ObjectProvider<JavaMailSender> mailSender,
                        @Value("${app.email.remetente:}") String remetente,
                        @Value("${app.email.remetente-nome:CRM Glass}") String remetenteNome,
                        Environment ambiente) {
        this.mailSender = mailSender.getIfAvailable();
        this.remetente = remetente == null ? "" : remetente.trim();
        this.remetenteNome = remetenteNome == null || remetenteNome.isBlank() ? "CRM Glass" : remetenteNome.trim();
        this.modeloCodigo = lerModelo(MODELO_CODIGO);
        this.configurado = verificarConfiguracao();
        if (!configurado) {
            log.warn("Envio de e-mail não configurado (MAIL_USUARIO / MAIL_SENHA_APP no .env ou no ambiente): "
                    + "o login vai responder 503 até configurar.");
        }
        avisarSenhaSemTls(ambiente);
    }

    public boolean configurado() {
        return configurado;
    }

    /**
     * Código de verificação do login.
     *
     * @return {@code true} se o servidor SMTP aceitou a mensagem
     */
    public boolean enviarCodigoVerificacao(String para, String nome, String codigo, Duration validade) {
        if (!configurado) {
            log.warn("E-mail para {} não enviado: SMTP não configurado.", LogSeguro.email(para));
            return false;
        }
        long minutos = validade.toMinutes();
        try {
            MimeMessage mensagem = mailSender.createMimeMessage();
            MimeMessageHelper m = new MimeMessageHelper(mensagem, true, StandardCharsets.UTF_8.name());
            m.setFrom(remetente, remetenteNome);
            m.setTo(para);
            m.setSubject("Seu código de acesso ao " + remetenteNome);
            m.setText(textoCodigo(nome, codigo, minutos), htmlCodigo(nome, codigo, minutos));
            mailSender.send(mensagem);
            return true;
        } catch (MailException | MessagingException | UnsupportedEncodingException e) {
            // Só o tipo do erro: a mensagem da exceção pode carregar dados do envio.
            log.warn("Falha ao enviar e-mail para {}: {}", LogSeguro.email(para), e.getClass().getSimpleName());
            return false;
        }
    }

    // ---------------------------------------------------------------- conteúdo

    private String htmlCodigo(String nome, String codigo, long minutos) {
        return modeloCodigo
                .replace("{{sistema}}", HtmlUtils.htmlEscape(remetenteNome))
                .replace("{{nome}}", HtmlUtils.htmlEscape(primeiroNome(nome)))
                .replace("{{minutos}}", String.valueOf(minutos))
                .replace("{{codigo}}", HtmlUtils.htmlEscape(codigo));
    }

    private String textoCodigo(String nome, String codigo, long minutos) {
        return "Olá, " + primeiroNome(nome) + "!\n\n"
                + "Seu código de acesso ao " + remetenteNome + " é:\n\n"
                + "    " + codigo + "\n\n"
                + "Ele vale " + minutos + " minutos e só pode ser usado uma vez.\n\n"
                + "Se não foi você que tentou entrar, troque sua senha assim que possível: "
                + "quem tentou sabe a sua senha atual.\n";
    }

    private static String primeiroNome(String nome) {
        if (nome == null || nome.isBlank()) {
            return "tudo bem";
        }
        return nome.trim().split("\\s+")[0];
    }

    // ---------------------------------------------------------------- configuração

    /** Host preenchido, remetente preenchido e, se o servidor pede login, usuário e senha preenchidos. */
    private boolean verificarConfiguracao() {
        if (mailSender == null || remetente.isBlank()) {
            return false;
        }
        if (mailSender instanceof JavaMailSenderImpl impl) {
            if (vazio(impl.getHost())) {
                return false;
            }
            boolean autentica = Boolean.parseBoolean(impl.getJavaMailProperties().getProperty("mail.smtp.auth", "false"));
            return !autentica || (!vazio(impl.getUsername()) && !vazio(impl.getPassword()));
        }
        return true;
    }

    /**
     * Login no SMTP sem STARTTLS manda a senha de app em texto claro pela rede. Em
     * dev/test é aceitável (ex.: Mailpit local); fora deles vira ERRO no log, sem
     * impedir a subida. A senha nunca entra na mensagem.
     */
    private void avisarSenhaSemTls(Environment ambiente) {
        if (!configurado || !(mailSender instanceof JavaMailSenderImpl impl)) {
            return;
        }
        Properties p = impl.getJavaMailProperties();
        boolean autentica = Boolean.parseBoolean(p.getProperty("mail.smtp.auth", "false"));
        boolean tls = Boolean.parseBoolean(p.getProperty("mail.smtp.starttls.required", "false"))
                || "smtps".equalsIgnoreCase(impl.getProtocol())
                || Boolean.parseBoolean(p.getProperty("mail.smtp.ssl.enable", "false"));
        if (!autentica || tls) {
            return;
        }
        if (ambiente.acceptsProfiles(Profiles.of("dev", "test"))) {
            log.warn("SMTP com login e sem STARTTLS (MAIL_STARTTLS=false): aceitável só em desenvolvimento.");
        } else {
            log.error("SMTP com login e sem STARTTLS (MAIL_STARTTLS=false): a senha do e-mail trafega em texto claro. "
                    + "Ligue MAIL_STARTTLS=true.");
        }
    }

    private static boolean vazio(String s) {
        return s == null || s.isBlank();
    }

    private static String lerModelo(String caminho) {
        try {
            return new ClassPathResource(caminho).getContentAsString(StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException("Modelo de e-mail não encontrado: " + caminho, e);
        }
    }
}
