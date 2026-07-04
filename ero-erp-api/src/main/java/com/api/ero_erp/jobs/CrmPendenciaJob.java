package com.api.ero_erp.jobs;

import com.api.ero_erp.crm.atendimento.service.CrmPendenciaService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class CrmPendenciaJob {

    private static final Logger log = LoggerFactory.getLogger(CrmPendenciaJob.class);

    private final CrmPendenciaService pendenciaService;

    public CrmPendenciaJob(CrmPendenciaService pendenciaService) {
        this.pendenciaService = pendenciaService;
    }

    @Scheduled(fixedRate = 300_000L)
    public void executar() {
        log.debug("Iniciando job de pendências do CRM...");
        try {
            pendenciaService.processarPendencias();
        } catch (Exception e) {
            log.error("Erro no job CrmPendenciaJob: {}", e.getMessage(), e);
        }
    }
}
