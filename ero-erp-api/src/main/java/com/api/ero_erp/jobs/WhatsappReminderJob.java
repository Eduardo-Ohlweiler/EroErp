package com.api.ero_erp.jobs;

import com.api.ero_erp.whatsapp.service.WhatsappReminderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class WhatsappReminderJob {

    private static final Logger log = LoggerFactory.getLogger(WhatsappReminderJob.class);

    private final WhatsappReminderService reminderService;

    public WhatsappReminderJob(WhatsappReminderService reminderService) {
        this.reminderService = reminderService;
    }

    @Scheduled(fixedRate = 300_000L)
    public void executar() {
        log.debug("Iniciando job de lembretes WhatsApp...");
        reminderService.processarPendentes();
    }
}
