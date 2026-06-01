package com.api.ero_erp.whatsapp.service;

import com.api.ero_erp.configuracaomensagem.entity.ConfiguracaoMensagem;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Component
public class WhatsappMessageBuilder {

    private static final DateTimeFormatter DATA_HORA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DateTimeFormatter HORA       = DateTimeFormatter.ofPattern("HH:mm");

    public record Contexto(
            String        usuarioNome,
            String        titulo,
            LocalDateTime inicio,
            LocalDateTime fim,
            String        pessoaNome,
            String        motivo
    ) {}

    // ---- Agendamento (compromisso criado) ----

    public String mensagemUsuarioCriacao(Contexto ctx) {
        var sb = new StringBuilder();
        sb.append("Olá ").append(ctx.usuarioNome()).append(", um novo compromisso foi agendado!\n\n");
        appendDetalhes(sb, ctx);
        return sb.toString().trim();
    }

    public String mensagemClienteCriacao(Contexto ctx, ConfiguracaoMensagem config) {
        var sb = new StringBuilder();
        appendCabecalho(sb, config != null ? config.getCabecalhoAgendamento() : null);
        appendDetalhesCliente(sb, ctx);
        appendRodape(sb, config != null ? config.getRodapeAgendamento() : null);
        return sb.toString().trim();
    }

    // ---- Lembrete (próximo do horário) ----

    public String mensagemUsuarioLembrete(Contexto ctx) {
        var sb = new StringBuilder();
        sb.append("Olá ").append(ctx.usuarioNome()).append(", você tem um compromisso em breve!\n\n");
        appendDetalhes(sb, ctx);
        return sb.toString().trim();
    }

    public String mensagemClienteLembrete(Contexto ctx, ConfiguracaoMensagem config) {
        var sb = new StringBuilder();
        appendCabecalho(sb, config != null ? config.getCabecalhoLembrete() : null);
        appendDetalhesCliente(sb, ctx);
        appendRodape(sb, config != null ? config.getRodapeLembrete() : null);
        return sb.toString().trim();
    }

    // ---- Cancelamento ----

    public String mensagemUsuarioCancelamento(Contexto ctx) {
        var sb = new StringBuilder();
        sb.append("Olá ").append(ctx.usuarioNome()).append(", um compromisso foi cancelado.\n\n");
        sb.append("📌 ").append(ctx.titulo()).append("\n");
        sb.append("📅 ").append(ctx.inicio().format(DATA_HORA));
        if (ctx.motivo() != null && !ctx.motivo().isBlank())
            sb.append("\n⚠️ Motivo: ").append(ctx.motivo());
        return sb.toString().trim();
    }

    public String mensagemClienteCancelamento(Contexto ctx, ConfiguracaoMensagem config) {
        var sb = new StringBuilder();
        appendCabecalho(sb, config != null ? config.getCabecalhoCancelamento() : null);
        sb.append("📌 ").append(ctx.titulo()).append("\n");
        sb.append("O compromisso de ").append(ctx.inicio().format(DATA_HORA)).append(" foi cancelado.");
        if (ctx.motivo() != null && !ctx.motivo().isBlank())
            sb.append("\nMotivo: ").append(ctx.motivo());
        appendRodape(sb, config != null ? config.getRodapeCancelamento() : null);
        return sb.toString().trim();
    }

    // ---- Conclusão ----

    public String mensagemUsuarioConclusao(Contexto ctx) {
        var sb = new StringBuilder();
        sb.append("Olá ").append(ctx.usuarioNome()).append(", compromisso concluído!\n\n");
        appendDetalhes(sb, ctx);
        return sb.toString().trim();
    }

    public String mensagemClienteConclusao(Contexto ctx, ConfiguracaoMensagem config) {
        var sb = new StringBuilder();
        appendCabecalho(sb, config != null ? config.getCabecalhoConclusao() : null);
        sb.append("📌 ").append(ctx.titulo()).append("\n");
        sb.append("O compromisso de ").append(ctx.inicio().format(DATA_HORA)).append(" foi concluído.");
        appendRodape(sb, config != null ? config.getRodapeConclusao() : null);
        return sb.toString().trim();
    }

    // ---- Helpers internos ----

    private void appendDetalhes(StringBuilder sb, Contexto ctx) {
        sb.append("📌 ").append(ctx.titulo()).append("\n");
        sb.append("📅 ").append(ctx.inicio().format(DATA_HORA));
        if (ctx.fim() != null)
            sb.append(" - ").append(ctx.fim().format(HORA));
        if (ctx.pessoaNome() != null && !ctx.pessoaNome().isBlank())
            sb.append("\n👤 ").append(ctx.pessoaNome());
    }

    private void appendDetalhesCliente(StringBuilder sb, Contexto ctx) {
        sb.append("📌 ").append(ctx.titulo()).append("\n");
        sb.append("📅 ").append(ctx.inicio().format(DATA_HORA));
        if (ctx.fim() != null)
            sb.append(" - ").append(ctx.fim().format(HORA));
        sb.append("\n");
    }

    private void appendCabecalho(StringBuilder sb, String cabecalho) {
        if (cabecalho != null && !cabecalho.isBlank())
            sb.append(cabecalho).append("\n\n");
    }

    private void appendRodape(StringBuilder sb, String rodape) {
        if (rodape != null && !rodape.isBlank())
            sb.append("\n\n").append(rodape);
    }
}
