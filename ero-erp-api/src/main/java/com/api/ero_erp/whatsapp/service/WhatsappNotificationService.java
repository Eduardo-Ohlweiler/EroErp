package com.api.ero_erp.whatsapp.service;

import com.api.ero_erp.configuracaomensagem.entity.ConfiguracaoMensagem;
import com.api.ero_erp.configuracaomensagem.service.ConfiguracaoMensagemService;
import com.api.ero_erp.compromisso.entity.Compromisso;
import com.api.ero_erp.telefone.repository.TelefoneRepository;
import com.api.ero_erp.whatsapp.whatsappconfigglobal.entity.WhatsappConfigGlobal;
import com.api.ero_erp.whatsapp.whatsappconfigglobal.repository.WhatsappConfigGlobalRepository;
import com.api.ero_erp.whatsapp.whatsappinstancia.entity.WhatsappInstancia;
import com.api.ero_erp.whatsapp.whatsappinstancia.repository.WhatsappInstanciaRepository;
import com.api.ero_erp.whatsapp.whatsapplog.service.WhatsappLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WhatsappNotificationService {

    private static final Logger log = LoggerFactory.getLogger(WhatsappNotificationService.class);

    private final WhatsappEvolutionClient         evolutionClient;
    private final WhatsappMessageBuilder          messageBuilder;
    private final WhatsappInstanciaRepository     instanciaRepository;
    private final WhatsappConfigGlobalRepository  configGlobalRepository;
    private final ConfiguracaoMensagemService     configuracaoMensagemService;
    private final WhatsappLogService              whatsappLogService;
    private final TelefoneRepository              telefoneRepository;

    public WhatsappNotificationService(
            WhatsappEvolutionClient        evolutionClient,
            WhatsappMessageBuilder         messageBuilder,
            WhatsappInstanciaRepository    instanciaRepository,
            WhatsappConfigGlobalRepository configGlobalRepository,
            ConfiguracaoMensagemService    configuracaoMensagemService,
            WhatsappLogService             whatsappLogService,
            TelefoneRepository             telefoneRepository
    ) {
        this.evolutionClient            = evolutionClient;
        this.messageBuilder             = messageBuilder;
        this.instanciaRepository        = instanciaRepository;
        this.configGlobalRepository     = configGlobalRepository;
        this.configuracaoMensagemService = configuracaoMensagemService;
        this.whatsappLogService         = whatsappLogService;
        this.telefoneRepository         = telefoneRepository;
    }

    public void notificarCriacaoRecorrente(List<Compromisso> compromissos) {
        if (compromissos == null || compromissos.isEmpty()) return;

        Compromisso primeiro = compromissos.get(0);
        String phoneCliente  = resolverPhoneCliente(primeiro);

        try {
            whatsappLogService.criarPendente(primeiro, phoneCliente);
        } catch (Exception e) {
            log.warn("Falha ao criar log para compromisso {}: {}", primeiro.getId(), e.getMessage());
        }

        try {
            ConfiguracaoMensagem config = configuracaoMensagemService
                    .findByUsuarioId(primeiro.getUsuario().getId()).orElse(null);

            String mensagemUsuario  = messageBuilder.mensagemUsuarioCriacaoRecorrente(compromissos);
            String mensagemCliente  = phoneCliente != null
                    ? messageBuilder.mensagemClienteCriacaoRecorrente(compromissos, config)
                    : null;

            enviarParaUsuarioECliente(primeiro, mensagemUsuario, mensagemCliente, phoneCliente);
        } catch (Exception e) {
            log.warn("Falha na notificação recorrente do compromisso {}: {}", primeiro.getId(), e.getMessage());
        }
    }

    public void notificarCriacao(Compromisso compromisso) {
        String phoneCliente = resolverPhoneCliente(compromisso);

        try {
            whatsappLogService.criarPendente(compromisso, phoneCliente);
        } catch (Exception e) {
            log.warn("Falha ao criar log para compromisso {}: {}", compromisso.getId(), e.getMessage());
        }

        try {
            ConfiguracaoMensagem config  = configuracaoMensagemService
                    .findByUsuarioId(compromisso.getUsuario().getId()).orElse(null);
            var ctx = buildContexto(compromisso, null);

            enviarParaUsuarioECliente(
                    compromisso,
                    messageBuilder.mensagemUsuarioCriacao(ctx),
                    phoneCliente != null ? messageBuilder.mensagemClienteCriacao(ctx, config) : null,
                    phoneCliente
            );
        } catch (Exception e) {
            log.warn("Falha na notificação imediata do compromisso {}: {}", compromisso.getId(), e.getMessage());
        }
    }

    public void notificarCancelamento(Compromisso compromisso) {
        try {
            whatsappLogService.cancelarPorCompromisso(compromisso.getId());

            ConfiguracaoMensagem config   = configuracaoMensagemService
                    .findByUsuarioId(compromisso.getUsuario().getId()).orElse(null);
            String               phoneCliente = resolverPhoneCliente(compromisso);
            var                  ctx          = buildContexto(compromisso, compromisso.getMotivoCancelamento());

            enviarParaUsuarioECliente(
                    compromisso,
                    messageBuilder.mensagemUsuarioCancelamento(ctx),
                    phoneCliente != null ? messageBuilder.mensagemClienteCancelamento(ctx, config) : null,
                    phoneCliente
            );
        } catch (Exception e) {
            log.warn("Falha ao notificar cancelamento do compromisso {}: {}", compromisso.getId(), e.getMessage());
        }
    }

    public void notificarConclusao(Compromisso compromisso) {
        try {
            whatsappLogService.cancelarPorCompromisso(compromisso.getId());

            ConfiguracaoMensagem config      = configuracaoMensagemService
                    .findByUsuarioId(compromisso.getUsuario().getId()).orElse(null);
            String               phoneCliente = resolverPhoneCliente(compromisso);
            var                  ctx          = buildContexto(compromisso, null);

            enviarParaUsuarioECliente(
                    compromisso,
                    messageBuilder.mensagemUsuarioConclusao(ctx),
                    phoneCliente != null ? messageBuilder.mensagemClienteConclusao(ctx, config) : null,
                    phoneCliente
            );
        } catch (Exception e) {
            log.warn("Falha ao notificar conclusão do compromisso {}: {}", compromisso.getId(), e.getMessage());
        }
    }

    private void enviarParaUsuarioECliente(
            Compromisso compromisso,
            String      mensagemUsuario,
            String      mensagemCliente,
            String      phoneCliente
    ) {
        WhatsappConfigGlobal configGlobal = configGlobalRepository.findFirstByAtivoTrue().orElse(null);
        if (configGlobal == null) return;

        WhatsappInstancia instancia = instanciaRepository
                .findByUsuarioIdAndClienteId(
                        compromisso.getUsuario().getId(),
                        compromisso.getCliente().getId()
                )
                .orElse(null);

        if (instancia == null || !Boolean.TRUE.equals(instancia.getAtivo())) return;

        String telefoneUsuario = compromisso.getUsuario().getTelefone();
        if (telefoneUsuario != null && !telefoneUsuario.isBlank()) {
            evolutionClient.enviar(
                    configGlobal.getApiUrl(),
                    instancia.getInstanceName(),
                    instancia.getToken(),
                    "55" + limparNumero(telefoneUsuario),
                    mensagemUsuario
            );
        }

        if (phoneCliente != null && mensagemCliente != null) {
            evolutionClient.enviar(
                    configGlobal.getApiUrl(),
                    instancia.getInstanceName(),
                    instancia.getToken(),
                    "55" + phoneCliente,
                    mensagemCliente
            );
        }
    }

    String resolverPhoneCliente(Compromisso compromisso) {
        if (compromisso.getPessoa() == null) return null;
        return telefoneRepository
                .findFirstByPessoaIdAndClienteIdAndTipoTelefoneId(
                        compromisso.getPessoa().getId(),
                        compromisso.getCliente().getId(),
                        2L
                )
                .map(t -> limparNumero(t.getNumero()))
                .orElse(null);
    }

    private WhatsappMessageBuilder.Contexto buildContexto(Compromisso compromisso, String motivo) {
        String pessoaNome    = compromisso.getPessoa()   != null ? compromisso.getPessoa().getNome() : null;
        String localEmitente = messageBuilder.resolverEnderecoEmitente(compromisso);
        return new WhatsappMessageBuilder.Contexto(
                compromisso.getUsuario().getNome(),
                compromisso.getTitulo(),
                compromisso.getInicio(),
                compromisso.getFim(),
                pessoaNome,
                motivo,
                localEmitente
        );
    }

    static String limparNumero(String numero) {
        return numero.replaceAll("\\D", "");
    }
}
