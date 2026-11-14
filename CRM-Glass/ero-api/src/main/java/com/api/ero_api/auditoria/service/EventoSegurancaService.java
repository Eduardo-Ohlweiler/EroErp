package com.api.ero_api.auditoria.service;

import com.api.ero_api.auditoria.dtos.JanelaEventosDto;
import com.api.ero_api.auditoria.entity.EventoSeguranca;
import com.api.ero_api.auditoria.enums.TipoEventoSeguranca;
import com.api.ero_api.auditoria.repository.EventoSegurancaRepository;
import com.api.ero_api.compartilhado.web.ClienteRequisicao;
import java.time.Instant;
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
 *   <li>{@link #reservar} e {@link #desfazerReserva}: evento que conta para um
 *       limite e é gravado ANTES da ação (código de login, antes do e-mail sair);
 *       se a ação falhar, a reserva é desfeita.</li>
 *   <li>{@link #janelaDoUsuario}: contagem para limites por usuário (códigos de login por hora).</li>
 * </ul>
 */
@Service
public class EventoSegurancaService {

    private static final Logger log = LoggerFactory.getLogger(EventoSegurancaService.class);

    private final EventoSegurancaRepository repository;

    public EventoSegurancaService(EventoSegurancaRepository repository) {
        this.repository = repository;
    }

    /**
     * Quantos eventos {@code tipo} o usuário teve desde {@code desde} (ex.: códigos
     * de login na última hora). Entra na transação de quem chama.
     */
    @Transactional(readOnly = true)
    public JanelaEventosDto janelaDoUsuario(UUID usuarioId, TipoEventoSeguranca tipo, Instant desde) {
        return repository.resumirDoUsuarioDesde(usuarioId, tipo, desde);
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
     * Como {@link #registrar} (mesma transação), devolvendo o id para
     * {@link #desfazerReserva}. Quem chama segura a linha do usuário travada: o
     * próximo pedido do mesmo usuário só conta depois do commit, já vendo esta reserva.
     */
    @Transactional
    public UUID reservar(TipoEventoSeguranca tipo, UUID usuarioId, UUID tenantId, String detalhe) {
        return salvar(tipo, usuarioId, tenantId, detalhe);
    }

    /** A ação reservada não aconteceu (ex.: o e-mail não saiu): o evento some e a vaga volta. */
    @Transactional
    public void desfazerReserva(UUID eventoId, TipoEventoSeguranca tipo) {
        int apagados = repository.apagarPorIdETipo(eventoId, tipo);
        log.info("evento_seguranca_desfeito tipo={} evento={} apagados={}", tipo, eventoId, apagados);
    }

    private UUID salvar(TipoEventoSeguranca tipo, UUID usuarioId, UUID tenantId, String detalhe) {
        EventoSeguranca e = new EventoSeguranca();
        e.setTipo(tipo);
        e.setUsuarioId(usuarioId);
        e.setTenantId(tenantId);
        e.setIp(ClienteRequisicao.ip());
        e.setUserAgent(ClienteRequisicao.userAgent());
        e.setDetalhe(detalhe == null ? null : detalhe.substring(0, Math.min(detalhe.length(), 500)));
        repository.save(e);
        log.info("evento_seguranca tipo={} usuario={} tenant={}", tipo, usuarioId, tenantId);
        return e.getId();
    }
}
