package com.api.ero_api.auditoria.service;

import com.api.ero_api.auditoria.dtos.EventoSegurancaResponseDto;
import com.api.ero_api.auditoria.entity.EventoSeguranca;
import com.api.ero_api.auditoria.enums.TipoEventoSeguranca;
import com.api.ero_api.auditoria.mapper.EventoSegurancaMapper;
import com.api.ero_api.auditoria.repository.EventoSegurancaRepository;
import com.api.ero_api.compartilhado.dtos.PaginaDto;
import com.api.ero_api.compartilhado.exception.RegraNegocioException;
import com.api.ero_api.compartilhado.util.PaginacaoUtils;
import com.api.ero_api.seguranca.SecurityUtils;
import com.api.ero_api.seguranca.tenant.TenantContext;
import com.api.ero_api.tenant.service.TenantService;
import com.api.ero_api.usuario.service.UsuarioService;
import java.time.Duration;
import java.time.Instant;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Stream;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Consulta da trilha de segurança (tela Logs).
 *
 * <ul>
 *   <li>Período padrão: últimos 7 dias; no máximo 1 ano por consulta.</li>
 *   <li>Superadmin na visão de plataforma vê todos os contratantes (ou um, pelo
 *       {@code tenantId}). Qualquer outro vê só o próprio contratante e o
 *       {@code tenantId} recebido é ignorado (o filtro é manual, porque o evento
 *       não é TenantEntity).</li>
 *   <li>Os nomes são resolvidos uma vez por página. Dentro de um contratante, o
 *       superadmin não é visível: o autor sai sem nome e o front mostra
 *       "Suporte da plataforma".</li>
 * </ul>
 */
@Service
public class ConsultaEventoService {

    private static final Set<String> ORDENAVEIS = Set.of("createdAt", "tipo");
    private static final Duration PERIODO_PADRAO = Duration.ofDays(7);
    private static final Duration PERIODO_MAXIMO = Duration.ofDays(366);

    private final EventoSegurancaRepository repository;
    private final UsuarioService usuarioService;
    private final TenantService tenantService;

    public ConsultaEventoService(EventoSegurancaRepository repository, UsuarioService usuarioService,
                                 TenantService tenantService) {
        this.repository = repository;
        this.usuarioService = usuarioService;
        this.tenantService = tenantService;
    }

    @Transactional(readOnly = true)
    public PaginaDto<EventoSegurancaResponseDto> listar(List<TipoEventoSeguranca> tipos, UUID usuarioId, UUID tenantId,
                                                        Instant de, Instant ate, Pageable pageable) {
        Instant fim = ate == null ? Instant.now() : ate;
        Instant inicio = de == null ? fim.minus(PERIODO_PADRAO) : de;
        if (!inicio.isBefore(fim)) {
            throw new RegraNegocioException("Período inválido.");
        }
        if (Duration.between(inicio, fim).compareTo(PERIODO_MAXIMO) > 0) {
            throw new RegraNegocioException("Escolha um período de até 1 ano.");
        }
        Set<TipoEventoSeguranca> filtroTipos = tipos == null || tipos.isEmpty()
                ? EnumSet.allOf(TipoEventoSeguranca.class)
                : EnumSet.copyOf(tipos);
        Pageable pagina = PaginacaoUtils.validar(pageable, ORDENAVEIS, Sort.by(Sort.Direction.DESC, "createdAt"));

        UUID tenantAtual = SecurityUtils.getTenantIdLogado();
        boolean plataforma = TenantContext.ROOT.equals(tenantAtual);
        Page<EventoSeguranca> eventos = plataforma
                ? repository.buscarDeTodos(tenantId, filtroTipos, usuarioId, inicio, fim, pagina)
                : repository.buscarDoTenant(tenantAtual, filtroTipos, usuarioId, inicio, fim, pagina);

        Map<UUID, String> nomesUsuarios = usuarioService.buscarNomes(idsDeUsuarios(eventos));
        Map<UUID, String> nomesTenants = plataforma ? tenantService.buscarNomes(idsDeTenants(eventos)) : Map.of();
        return PaginaDto.de(eventos, e -> EventoSegurancaMapper.toResponseDto(e, nomesUsuarios, nomesTenants));
    }

    private static Set<UUID> idsDeUsuarios(Page<EventoSeguranca> eventos) {
        Set<UUID> ids = new HashSet<>();
        eventos.forEach(e -> Stream.of(e.getUsuarioId(), e.getCreatedBy()).filter(Objects::nonNull).forEach(ids::add));
        return ids;
    }

    private static Set<UUID> idsDeTenants(Page<EventoSeguranca> eventos) {
        Set<UUID> ids = new HashSet<>();
        eventos.forEach(e -> {
            if (e.getTenantId() != null) {
                ids.add(e.getTenantId());
            }
        });
        return ids;
    }
}
