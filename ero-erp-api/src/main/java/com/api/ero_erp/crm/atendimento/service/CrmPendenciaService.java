package com.api.ero_erp.crm.atendimento.service;

import com.api.ero_erp.crm.atendimento.entity.Atendimento;
import com.api.ero_erp.crm.atendimento.entity.Mensagem;
import com.api.ero_erp.crm.atendimento.enums.DirecaoMensagem;
import com.api.ero_erp.crm.atendimento.enums.TipoMensagem;
import com.api.ero_erp.crm.atendimento.mapper.AtendimentoMapper;
import com.api.ero_erp.crm.atendimento.mapper.MensagemMapper;
import com.api.ero_erp.crm.atendimento.repository.AtendimentoRepository;
import com.api.ero_erp.crm.atendimento.repository.MensagemRepository;
import com.api.ero_erp.crm.configuracaocrm.entity.ConfiguracaoCrm;
import com.api.ero_erp.crm.configuracaocrm.repository.ConfiguracaoCrmRepository;
import com.api.ero_erp.crm.lembretependencia.entity.CrmLembretePendencia;
import com.api.ero_erp.crm.lembretependencia.repository.CrmLembretePendenciaRepository;
import com.api.ero_erp.crm.sse.CrmSseService;
import com.api.ero_erp.whatsapp.service.WhatsappEvolutionClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

/**
 * Rotina de reengajamento (pendências). Para cada cliente com pendências ativas,
 * varre os atendimentos abertos e, com base na última mensagem recebida do cliente,
 * envia o próximo lembrete configurado ainda não disparado no ciclo atual.
 */
@Service
public class CrmPendenciaService {

    private static final Logger log = LoggerFactory.getLogger(CrmPendenciaService.class);

    private final ConfiguracaoCrmRepository       configuracaoCrmRepository;
    private final CrmLembretePendenciaRepository  lembreteRepository;
    private final AtendimentoRepository           atendimentoRepository;
    private final MensagemRepository              mensagemRepository;
    private final WhatsappEvolutionClient         evolutionClient;
    private final CrmSseService                   sseService;

    public CrmPendenciaService(
            ConfiguracaoCrmRepository      configuracaoCrmRepository,
            CrmLembretePendenciaRepository lembreteRepository,
            AtendimentoRepository          atendimentoRepository,
            MensagemRepository             mensagemRepository,
            WhatsappEvolutionClient        evolutionClient,
            CrmSseService                  sseService
    ) {
        this.configuracaoCrmRepository = configuracaoCrmRepository;
        this.lembreteRepository        = lembreteRepository;
        this.atendimentoRepository     = atendimentoRepository;
        this.mensagemRepository        = mensagemRepository;
        this.evolutionClient           = evolutionClient;
        this.sseService                = sseService;
    }

    @Transactional
    public void processarPendencias() {
        List<ConfiguracaoCrm> configs = configuracaoCrmRepository.findByAtivarPendenciasTrue();
        for (ConfiguracaoCrm config : configs) {
            try {
                processarCliente(config);
            } catch (Exception e) {
                log.error("Erro ao processar pendências do cliente {}: {}",
                        config.getCliente() != null ? config.getCliente().getId() : null, e.getMessage());
            }
        }
    }

    private void processarCliente(ConfiguracaoCrm config) {
        if (config.getCliente() == null) return;
        Long clienteId = config.getCliente().getId();

        if (config.getApiUrl() == null || config.getApiUrl().isBlank()
                || config.getInstanceName() == null || config.getInstanceName().isBlank()
                || config.getApiKey() == null || config.getApiKey().isBlank()) {
            return; // conexão incompleta
        }

        List<CrmLembretePendencia> lembretes =
                lembreteRepository.findByConfiguracaoCrmIdOrderByOrdemAsc(config.getId());
        if (lembretes.isEmpty()) return;

        // ordena por tempo_horas crescente
        lembretes.sort(Comparator.comparing(
                l -> l.getTempoHoras() != null ? l.getTempoHoras() : Integer.MAX_VALUE));

        LocalDateTime agora = LocalDateTime.now();
        List<Atendimento> abertos = atendimentoRepository.findAbertosComRespostaCliente(clienteId);

        for (Atendimento atendimento : abertos) {
            LocalDateTime ultima = atendimento.getDataUltimaMensagemCliente();
            if (ultima == null) continue;

            long horasDecorridas = Duration.between(ultima, agora).toHours();
            int jaEnviado = atendimento.getUltimoLembreteHoras() != null
                    ? atendimento.getUltimoLembreteHoras() : 0;

            // próximo lembrete: menor tempo_horas ainda não enviado e já elegível
            CrmLembretePendencia proximo = lembretes.stream()
                    .filter(l -> l.getTempoHoras() != null)
                    .filter(l -> l.getTempoHoras() > jaEnviado)
                    .filter(l -> l.getTempoHoras() <= horasDecorridas)
                    .findFirst()
                    .orElse(null);

            if (proximo == null) continue;

            try {
                evolutionClient.enviar(config.getApiUrl(), config.getInstanceName(), config.getApiKey(),
                        atendimento.getNumero(), proximo.getMensagem());

                Mensagem mensagem = new Mensagem();
                mensagem.setCliente(config.getCliente());
                mensagem.setAtendimento(atendimento);
                mensagem.setDirecao(DirecaoMensagem.ENVIADA);
                mensagem.setTipo(TipoMensagem.TEXTO);
                mensagem.setConteudo(proximo.getMensagem());
                mensagem.setStatus("ENVIADA");
                mensagem.setDataMensagem(agora);
                Mensagem salva = mensagemRepository.save(mensagem);

                atendimento.setUltimoLembreteHoras(proximo.getTempoHoras());
                atendimento.setDataUltimaMensagem(agora);
                atendimentoRepository.save(atendimento);

                sseService.emit(clienteId, "mensagem-nova", MensagemMapper.toDto(salva));
                sseService.emit(clienteId, "atendimento-atualizado", AtendimentoMapper.toDto(atendimento));

                log.info("Pendência: lembrete {}h enviado para atendimento {} (cliente {})",
                        proximo.getTempoHoras(), atendimento.getId(), clienteId);
            } catch (Exception e) {
                log.error("Falha ao enviar lembrete de pendência do atendimento {}: {}",
                        atendimento.getId(), e.getMessage());
            }
        }
    }
}
