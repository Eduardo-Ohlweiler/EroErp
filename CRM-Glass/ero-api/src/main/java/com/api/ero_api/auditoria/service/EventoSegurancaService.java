package com.api.ero_api.auditoria.service;

import com.api.ero_api.auditoria.entity.EventoSeguranca;
import com.api.ero_api.auditoria.enums.TipoEventoSeguranca;
import com.api.ero_api.auditoria.repository.EventoSegurancaRepository;
import com.api.ero_api.compartilhado.web.ClienteRequisicao;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Grava a trilha de segurança. A consulta fica no {@link ConsultaEventoService}
 * (ela precisa dos nomes de usuários e contratantes, e quem grava evento é
 * justamente o UsuarioService e o TenantService: juntar os dois criaria ciclo).
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
