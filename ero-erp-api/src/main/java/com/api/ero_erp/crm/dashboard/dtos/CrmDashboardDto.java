package com.api.ero_erp.crm.dashboard.dtos;

import java.util.List;

/**
 * Payload completo do dashboard BI do CRM.
 *
 * <p>Escopos de filtro (importante para o frontend):
 * <ul>
 *   <li>{@code resumo}, {@code porAndamento}, {@code porUsuario}, {@code porPeriodo}
 *       consideram período + usuário + andamento + UF (todos os filtros).</li>
 *   <li>{@code porUf} e {@code porRegiao} consideram período + usuário + andamento,
 *       mas IGNORAM o filtro de UF (o mapa mostra a distribuição completa).</li>
 *   <li>{@code pendencias} reflete o estado atual (atendimentos abertos aguardando
 *       retorno), sem filtro de período/UF; só é preenchido quando o tenant tem
 *       pendências ativadas ({@code pendenciasAtivas == true}).</li>
 * </ul>
 */
public record CrmDashboardDto(
        ResumoDto                    resumo,
        List<ContagemAndamentoDto>   porAndamento,
        List<ContagemUsuarioDto>     porUsuario,
        List<PontoPeriodoDto>        porPeriodo,
        List<ContagemUfDto>          porUf,
        List<ContagemRegiaoDto>      porRegiao,
        boolean                      pendenciasAtivas,
        PendenciasDto                pendencias
) {

    /**
     * KPIs agregados. {@code taxaConclusao} é uma fração (0..1) = concluídos / finalizados.
     * Tempos médios em horas; {@code null} quando não há amostras.
     */
    public record ResumoDto(
            long   total,
            long   abertos,
            long   concluidos,
            long   cancelados,
            long   semResponsavel,
            long   mensagensNaoLidas,
            Double tempoMedioConclusaoHoras,
            Double tempoMedioRespostaHoras,
            double taxaConclusao
    ) {}

    /** Distribuição por andamento (coluna do kanban). */
    public record ContagemAndamentoDto(
            Long   andamentoId,
            String nome,
            String cor,
            String chave,
            long   quantidade
    ) {}

    /** Distribuição por usuário responsável ({@code usuarioId} null = "Sem responsável"). */
    public record ContagemUsuarioDto(
            Long   usuarioId,
            String nome,
            long   total,
            long   abertos,
            long   concluidos,
            long   cancelados
    ) {}

    /** Série temporal: aberturas e conclusões por bucket (dia "dd/MM" ou mês "MM/yyyy"). */
    public record PontoPeriodoDto(
            String periodo,
            long   abertos,
            long   concluidos
    ) {}

    /** Distribuição por UF (sigla) — {@code uf} pode ser "Sem localização". */
    public record ContagemUfDto(
            String uf,
            long   quantidade
    ) {}

    /** Distribuição por região do Brasil — pode ser "Sem localização". */
    public record ContagemRegiaoDto(
            String regiao,
            long   quantidade
    ) {}

    /** Bloco de pendências (atendimentos abertos com resposta do cliente aguardando retorno). */
    public record PendenciasDto(
            long                       total,
            List<PendenciaUsuarioDto>  porUsuario,
            List<PendenciaFaixaDto>    porFaixa
    ) {}

    /** Pendências por usuário responsável ({@code usuarioId} null = "Sem responsável"). */
    public record PendenciaUsuarioDto(
            Long   usuarioId,
            String nome,
            long   quantidade
    ) {}

    /** Pendências por faixa de tempo sem retorno: "0-24h", "24-48h", "48-72h", ">72h". */
    public record PendenciaFaixaDto(
            String faixa,
            long   quantidade
    ) {}
}
