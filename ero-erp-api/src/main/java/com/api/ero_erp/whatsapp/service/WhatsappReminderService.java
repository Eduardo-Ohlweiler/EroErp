package com.api.ero_erp.whatsapp.service;

import com.api.ero_erp.configuracaomensagem.entity.ConfiguracaoMensagem;
import com.api.ero_erp.configuracaomensagem.service.ConfiguracaoMensagemService;
import com.api.ero_erp.compromisso.entity.Compromisso;
import com.api.ero_erp.whatsapp.whatsappconfigglobal.entity.WhatsappConfigGlobal;
import com.api.ero_erp.whatsapp.whatsappconfigglobal.repository.WhatsappConfigGlobalRepository;
import com.api.ero_erp.whatsapp.whatsappinstancia.entity.WhatsappInstancia;
import com.api.ero_erp.whatsapp.whatsappinstancia.repository.WhatsappInstanciaRepository;
import com.api.ero_erp.whatsapp.whatsapplog.entity.WhatsappLog;
import com.api.ero_erp.whatsapp.whatsapplog.service.WhatsappLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class WhatsappReminderService {

    private static final Logger log = LoggerFactory.getLogger(WhatsappReminderService.class);

    private final WhatsappLogService              logService;
    private final WhatsappInstanciaRepository     instanciaRepository;
    private final WhatsappConfigGlobalRepository  configGlobalRepository;
    private final ConfiguracaoMensagemService     configuracaoMensagemService;
    private final WhatsappEvolutionClient         evolutionClient;
    private final WhatsappMessageBuilder          messageBuilder;

    public WhatsappReminderService(
            WhatsappLogService             logService,
            WhatsappInstanciaRepository    instanciaRepository,
            WhatsappConfigGlobalRepository configGlobalRepository,
            ConfiguracaoMensagemService    configuracaoMensagemService,
            WhatsappEvolutionClient        evolutionClient,
            WhatsappMessageBuilder         messageBuilder
    ) {
        this.logService                  = logService;
        this.instanciaRepository         = instanciaRepository;
        this.configGlobalRepository      = configGlobalRepository;
        this.configuracaoMensagemService = configuracaoMensagemService;
        this.evolutionClient             = evolutionClient;
        this.messageBuilder              = messageBuilder;
    }

    @Transactional
    public void processarPendentes() {
        Optional<WhatsappConfigGlobal> configOpt = configGlobalRepository.findFirstByAtivoTrue();
        if (configOpt.isEmpty()) return;

        WhatsappConfigGlobal configGlobal = configOpt.get();
        List<WhatsappLog>    pendentes    = logService.buscarPendentes();

        if (pendentes.isEmpty()) return;

        log.info("Processando {} lembretes pendentes", pendentes.size());

        for (WhatsappLog entrada : pendentes) {
            processarEntrada(entrada, configGlobal);
        }
    }

    private void processarEntrada(WhatsappLog entrada, WhatsappConfigGlobal configGlobal) {
        try {
            Compromisso compromisso = entrada.getCompromisso();

            if (Boolean.TRUE.equals(compromisso.getCancelado()) || Boolean.TRUE.equals(compromisso.getConcluido())) {
                logService.marcarEnviado(entrada);
                return;
            }

            WhatsappInstancia instancia = instanciaRepository
                    .findByUsuarioIdAndClienteId(
                            entrada.getUsuario().getId(),
                            entrada.getCliente().getId()
                    )
                    .orElse(null);

            if (instancia == null || !Boolean.TRUE.equals(instancia.getAtivo())) return;

            ZoneId        timezone        = ZoneId.of(instancia.getTimezone());
            ZonedDateTime agora           = ZonedDateTime.now(timezone);
            ZonedDateTime inicioDoEvento  = compromisso.getInicio().atZone(timezone);

            long diferencaMinutos = (inicioDoEvento.toEpochSecond() - agora.toEpochSecond()) / 60;

            if (diferencaMinutos <= 0) {
                logService.marcarEnviado(entrada);
                return;
            }

            if (diferencaMinutos > instancia.getAntecedenciaMinutos()) return;

            enviarLembrete(entrada, compromisso, instancia, configGlobal);
            logService.marcarEnviado(entrada);

        } catch (Exception e) {
            log.error("Erro ao processar lembrete id={}: {}", entrada.getId(), e.getMessage());
            logService.marcarErro(entrada, e.getMessage());
        }
    }

    private void enviarLembrete(
            WhatsappLog          entrada,
            Compromisso          compromisso,
            WhatsappInstancia    instancia,
            WhatsappConfigGlobal configGlobal
    ) {
        ConfiguracaoMensagem config = configuracaoMensagemService
                .findByUsuarioId(entrada.getUsuario().getId())
                .orElse(null);

        String pessoaNome    = entrada.getPessoa() != null ? entrada.getPessoa().getNome() : null;
        String localEmitente = messageBuilder.resolverEnderecoEmitente(compromisso); // ← novo

        var ctx = new WhatsappMessageBuilder.Contexto(
                entrada.getUsuario().getNome(),
                compromisso.getTitulo(),
                compromisso.getInicio(),
                compromisso.getFim(),
                pessoaNome,
                null,
                localEmitente  // ← novo
        );

        String telefoneUsuario = entrada.getUsuario().getTelefone();
        if (telefoneUsuario != null && !telefoneUsuario.isBlank()) {
            evolutionClient.enviar(
                    configGlobal.getApiUrl(),
                    instancia.getInstanceName(),
                    instancia.getToken(),
                    "55" + telefoneUsuario.replaceAll("\\D", ""),
                    messageBuilder.mensagemUsuarioLembrete(ctx)
            );
        }

        String phoneCliente = entrada.getPhoneCliente();
        if (phoneCliente != null && !phoneCliente.isBlank()) {
            evolutionClient.enviar(
                    configGlobal.getApiUrl(),
                    instancia.getInstanceName(),
                    instancia.getToken(),
                    "55" + phoneCliente,
                    messageBuilder.mensagemClienteLembrete(ctx, config)
            );
        }
    }
}
