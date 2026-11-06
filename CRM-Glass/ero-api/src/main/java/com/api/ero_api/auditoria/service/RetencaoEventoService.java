package com.api.ero_api.auditoria.service;

import com.api.ero_api.auditoria.repository.EventoSegurancaRepository;
import com.api.ero_api.sessao.service.SessaoService;
import java.time.Duration;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Limpeza diária (LGPD: guardar só pelo tempo necessário).
 *
 * <ul>
 *   <li>Eventos de segurança mais antigos que {@code app.auditoria.retencao}
 *       (padrão {@code P365D}, 12 meses).</li>
 *   <li>Sessões e refresh tokens já expirados (não servem para mais nada).</li>
 * </ul>
 *
 * <p>Roda sem usuário logado: as três tabelas são da plataforma (não são
 * TenantEntity), então o DELETE alcança todos os contratantes sem contexto ROOT.
 */
@Service
public class RetencaoEventoService {

    private static final Logger log = LoggerFactory.getLogger(RetencaoEventoService.class);

    private final EventoSegurancaRepository repository;
    private final SessaoService sessaoService;
    private final Duration retencao;

    public RetencaoEventoService(EventoSegurancaRepository repository, SessaoService sessaoService,
                                 @Value("${app.auditoria.retencao:P365D}") Duration retencao) {
        this.repository = repository;
        this.sessaoService = sessaoService;
        this.retencao = retencao;
    }

    @Scheduled(cron = "${app.auditoria.retencao-cron:0 30 3 * * *}")
    @Transactional
    public void limpar() {
        Instant agora = Instant.now();
        int eventos = repository.apagarAnterioresA(agora.minus(retencao));
        SessaoService.Limpeza sessoes = sessaoService.apagarExpiradas(agora);
        log.info("retencao eventos_apagados={} sessoes_apagadas={} refresh_tokens_apagados={}",
                eventos, sessoes.sessoes(), sessoes.refreshTokens());
    }
}
