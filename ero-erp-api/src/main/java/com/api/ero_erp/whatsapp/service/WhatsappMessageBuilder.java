package com.api.ero_erp.whatsapp.service;

import com.api.ero_erp.compromisso.entity.Compromisso;
import com.api.ero_erp.configuracaomensagem.entity.ConfiguracaoMensagem;
import com.api.ero_erp.endereco.entity.Endereco;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

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
            String        motivo,
            String        localEmitente
    ) {}

    public String mensagemUsuarioCriacao(Contexto ctx) {
        var sb = new StringBuilder();
        sb.append("Olá ").append(ctx.usuarioNome()).append(", um novo compromisso foi agendado!\n\n");
        appendDetalhes(sb, ctx);
        return sb.toString().trim();
    }

    public String mensagemUsuarioCriacaoRecorrente(List<Compromisso> compromissos) {
        Compromisso primeiro = compromissos.get(0);
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

        StringBuilder sb = new StringBuilder();
        sb.append("📅 *").append(primeiro.getTitulo()).append("* — ").append(compromissos.size()).append(" ocorrências agendadas:\n\n");

        for (int i = 0; i < compromissos.size(); i++) {
            Compromisso c = compromissos.get(i);
            sb.append(i + 1).append(". ")
                    .append(c.getInicio().format(fmt))
                    .append(" até ")
                    .append(c.getFim().format(DateTimeFormatter.ofPattern("HH:mm")))
                    .append("\n");
        }
        return sb.toString();
    }

    public String mensagemClienteCriacaoRecorrente(List<Compromisso> compromissos, ConfiguracaoMensagem config) {
        Compromisso primeiro = compromissos.get(0);
        var sb               = new StringBuilder();

        appendCabecalho(sb, config != null ? config.getCabecalhoAgendamento() : null);
        sb.append("📅 ").append(primeiro.getTitulo()).append("\n");
        sb.append(compromissos.size()).append(" ocorrências agendadas:\n\n");

        for (int i = 0; i < compromissos.size(); i++) {
            Compromisso c = compromissos.get(i);
            sb.append(i + 1).append(". ")
                    .append(c.getInicio().format(DATA_HORA))
                    .append(" - ")
                    .append(c.getFim().format(HORA))
                    .append("\n");
        }
        if (primeiro.getPessoa() != null && primeiro.getPessoa().getNome() != null)
            sb.append("\n👤 ").append(primeiro.getPessoa().getNome());

        appendRodape(sb, config != null ? config.getRodapeAgendamento() : null);

        return sb.toString().trim();
    }

    public String mensagemClienteCriacao(Contexto ctx, ConfiguracaoMensagem config) {
        var sb = new StringBuilder();
        appendCabecalho(sb, config != null ? config.getCabecalhoAgendamento() : null);
        appendDetalhesCliente(sb, ctx);
        appendRodape(sb, config != null ? config.getRodapeAgendamento() : null);
        return sb.toString().trim();
    }

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

    private void appendDetalhes(StringBuilder sb, Contexto ctx) {
        sb.append("📋 ").append(ctx.titulo()).append("\n");
        sb.append("🕐 ").append(ctx.inicio().format(DATA_HORA));
        if (ctx.fim() != null)
            sb.append(" - ").append(ctx.fim().format(HORA));
        if (ctx.localEmitente() != null && !ctx.localEmitente().isBlank())
            sb.append("\n📍 ").append(ctx.localEmitente());
        if (ctx.pessoaNome() != null && !ctx.pessoaNome().isBlank())
            sb.append("\n👤 ").append(ctx.pessoaNome());
    }

    private void appendDetalhesCliente(StringBuilder sb, Contexto ctx) {
        sb.append("📋 ").append(ctx.titulo()).append("\n");
        sb.append("🕐 ").append(ctx.inicio().format(DATA_HORA));
        if (ctx.fim() != null)
            sb.append(" - ").append(ctx.fim().format(HORA));
        if (ctx.localEmitente() != null && !ctx.localEmitente().isBlank())
            sb.append("\n📍 ").append(ctx.localEmitente());
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

    public String resolverEnderecoEmitente(Compromisso compromisso) {
        if (compromisso.getEmitente() == null)
            return null;

        List<Endereco> enderecos = compromisso.getEmitente().getPessoa().getEnderecos();
        if (enderecos == null || enderecos.isEmpty())
            return null;

        Endereco endereco = enderecos.stream()
                .filter(e -> Boolean.TRUE.equals(e.getPrincipal()))
                .findFirst()
                .orElse(enderecos.get(0));

        StringBuilder sb = new StringBuilder();
        if (endereco.getRua()    != null)
            sb.append(endereco.getRua());
        if (endereco.getNumero() != null)
            sb.append(", ").append(endereco.getNumero());
        if (endereco.getBairro() != null)
            sb.append(" - ").append(endereco.getBairro());
        if (endereco.getComplemento() != null && !endereco.getComplemento().isBlank())
            sb.append(" (").append(endereco.getComplemento()).append(")");
        if (endereco.getCidade() != null) {
            sb.append(", ").append(endereco.getCidade().getNome());
            if (endereco.getCidade().getEstado() != null)
                sb.append("/").append(endereco.getCidade().getEstado().getSigla());
        }
        return sb.toString().isBlank() ? null : sb.toString();
    }
}
