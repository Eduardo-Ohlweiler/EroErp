package com.api.ero_api.support;

import jakarta.mail.Address;
import jakarta.mail.BodyPart;
import jakarta.mail.Message;
import jakarta.mail.MessagingException;
import jakarta.mail.Multipart;
import jakarta.mail.Part;
import jakarta.mail.internet.MimeMessage;
import java.io.IOException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSenderImpl;

/**
 * No lugar do JavaMailSender nos testes: nada sai pela rede. Guarda cada mensagem
 * (destinatário, texto e o código de 6 dígitos achado no texto puro) e pode
 * simular o SMTP fora do ar com {@link #falharEnvios(boolean)}.
 *
 * <p>Registrada por {@code @Import} no IntegracaoTest: com um JavaMailSender já
 * declarado, a autoconfiguração de e-mail do Spring não cria o dela.
 */
public class CaixaDeEmailFake extends JavaMailSenderImpl {

    private static final Pattern CODIGO = Pattern.compile("(?m)^\\s*(\\d{6})\\s*$");

    /** Uma mensagem recebida. */
    public record Recebido(String para, String assunto, String texto, String html, String codigo) {
    }

    private final List<Recebido> recebidos = new ArrayList<>();
    private volatile boolean falhar;
    private volatile Duration atraso = Duration.ZERO;

    public CaixaDeEmailFake() {
        // "Configurado" para o EmailService: host preenchido e sem autenticação.
        setHost("localhost");
    }

    public void falharEnvios(boolean falhar) {
        this.falhar = falhar;
    }

    public synchronized Optional<Recebido> ultimoPara(String email) {
        String alvo = email.toLowerCase(Locale.ROOT);
        for (int i = recebidos.size() - 1; i >= 0; i--) {
            if (recebidos.get(i).para().equals(alvo)) {
                return Optional.of(recebidos.get(i));
            }
        }
        return Optional.empty();
    }

    public String ultimoCodigoPara(String email) {
        return ultimoPara(email).map(Recebido::codigo)
                .orElseThrow(() -> new AssertionError("Nenhum e-mail recebido por " + email));
    }

    public synchronized long quantosPara(String email) {
        String alvo = email.toLowerCase(Locale.ROOT);
        return recebidos.stream().filter(r -> r.para().equals(alvo)).count();
    }

    /**
     * Cada envio demora este tempo (SMTP lento de verdade leva de 1 a 3 s). A espera
     * fica fora do monitor: envios em paralelo esperam ao mesmo tempo. Zere no finally.
     */
    public void atrasarEnvios(Duration atraso) {
        this.atraso = atraso;
    }

    @Override
    protected void doSend(MimeMessage[] mensagens, Object[] originais) {
        if (!atraso.isZero()) {
            try {
                Thread.sleep(atraso);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
        guardar(mensagens);
    }

    private synchronized void guardar(MimeMessage[] mensagens) {
        if (falhar) {
            throw new MailSendException("SMTP simulado fora do ar");
        }
        for (MimeMessage m : mensagens) {
            try {
                m.saveChanges(); // monta os cabeçalhos (Content-Type) como no envio de verdade
                Address[] para = m.getRecipients(Message.RecipientType.TO);
                String texto = parte(m, "text/plain");
                String html = parte(m, "text/html");
                Matcher codigo = CODIGO.matcher(texto == null ? "" : texto);
                recebidos.add(new Recebido(para[0].toString().toLowerCase(Locale.ROOT), m.getSubject(), texto, html,
                        codigo.find() ? codigo.group(1) : null));
            } catch (MessagingException | IOException e) {
                throw new MailSendException("Mensagem ilegível no teste", e);
            }
        }
    }

    private static String parte(Part p, String tipo) throws MessagingException, IOException {
        if (p.isMimeType(tipo)) {
            return (String) p.getContent();
        }
        if (p.isMimeType("multipart/*")) {
            Multipart mp = (Multipart) p.getContent();
            for (int i = 0; i < mp.getCount(); i++) {
                BodyPart bp = mp.getBodyPart(i);
                String achado = parte(bp, tipo);
                if (achado != null) {
                    return achado;
                }
            }
        }
        return null;
    }
}
