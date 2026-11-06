package com.api.ero_api.auditoria.service;

import com.api.ero_api.auditoria.dtos.EventoSegurancaResponseDto;
import com.api.ero_api.auditoria.entity.EventoSeguranca;
import com.api.ero_api.auditoria.enums.TipoEventoSeguranca;
import com.api.ero_api.auditoria.mapper.EventoSegurancaMapper;
import com.api.ero_api.auditoria.repository.EventoSegurancaRepository;
import com.api.ero_api.compartilhado.dtos.PaginaDto;
import com.api.ero_api.compartilhado.util.PaginacaoUtils;
import com.api.ero_api.compartilhado.web.ClienteRequisicao;
import com.api.ero_api.seguranca.SecurityUtils;
import com.api.ero_api.seguranca.tenant.TenantContext;
import java.util.Set;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Grava e consulta a trilha de segurança.
 *
 * <ul>
 *   <li>{@link #registrar}: entra na transação atual (se ela desfizer, o evento some junto).</li>
 *   <li>{@link #registrarIndependente}: transação própria, para falhas que vão
 *       lançar exceção logo depois (login errado, refresh reutilizado).</li>
 * </ul>
 */
@Service
public class EventoSegurancaService {

    private static final Logger log = LoggerFactory.getLogger(EventoSegurancaService.class);
    private static final Set<String> ORDENAVEIS = Set.of("createdAt", "tipo");

    private final EventoSegurancaRepository repository;

    public EventoSegurancaService(EventoSegurancaRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void registrar(TipoEventoSeguranca tipo, UUID usuarioId, UUID tenantId, String detalhe) {
        salvar(tipo, usuarioId, tenantId, detalhe);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrarIndependente(TipoEventoSeguranca tipo, UUID usuarioId, UUID tenantId, String detalhe) {
        salvar(tipo, usuarioId, tenantId, detalhe);
    }

    /**
     * Superadmin na visão de plataforma vê todos os tenants; qualquer outro vê
     * só o próprio tenant (filtro manual, porque o evento não é TenantEntity).
     */
    @Transactional(readOnly = true)
    public PaginaDto<EventoSegurancaResponseDto> listar(TipoEventoSeguranca tipo, UUID usuarioId, Pageable pageable) {
        UUID tenantAtual = SecurityUtils.getTenantIdLogado();
        Pageable pagina = PaginacaoUtils.validar(pageable, ORDENAVEIS, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<EventoSeguranca> eventos = TenantContext.ROOT.equals(tenantAtual)
                ? repository.buscarDeTodos(tipo, usuarioId, pagina)
                : repository.buscarDoTenant(tenantAtual, tipo, usuarioId, pagina);
        return PaginaDto.de(eventos, EventoSegurancaMapper::toResponseDto);
    }

    private void salvar(TipoEventoSeguranca tipo, UUID usuarioId, UUID tenantId, String detalhe) {
        EventoSeguranca e = new EventoSeguranca();
        e.setTipo(tipo);
        e.setUsuarioId(usuarioId);
        e.setTenantId(tenantId);
        e.setIp(ClienteRequisicao.ip());
        e.setUserAgent(ClienteRequisicao.userAgent());
        e.setDetalhe(detalhe == null ? null : detalhe.substring(0, Math.min(detalhe.length(), 500)));
        repository.save(e);
        log.info("evento_seguranca tipo={} usuario={} tenant={}", tipo, usuarioId, tenantId);
    }
}
