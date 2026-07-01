package com.api.ero_erp.crm.configuracaocrm.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.cliente.service.ClienteService;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.crm.configuracaocrm.dtos.ConfiguracaoCrmResponseDto;
import com.api.ero_erp.crm.configuracaocrm.dtos.ConfiguracaoCrmUpsertDto;
import com.api.ero_erp.crm.configuracaocrm.dtos.CrmQrCodeResponseDto;
import com.api.ero_erp.crm.configuracaocrm.dtos.CrmStatusResponseDto;
import com.api.ero_erp.crm.configuracaocrm.entity.ConfiguracaoCrm;
import com.api.ero_erp.crm.configuracaocrm.mapper.ConfiguracaoCrmMapper;
import com.api.ero_erp.crm.configuracaocrm.repository.ConfiguracaoCrmRepository;
import com.api.ero_erp.crm.lembretependencia.service.CrmLembretePendenciaService;
import com.api.ero_erp.exceptions.BadRequestException;
import com.api.ero_erp.whatsapp.service.WhatsappEvolutionClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class ConfiguracaoCrmService {

    private final ConfiguracaoCrmRepository     repository;
    private final ClienteService                clienteService;
    private final SecurityUtils                 securityUtils;
    private final WhatsappEvolutionClient       evolutionClient;
    private final CrmLembretePendenciaService   lembretePendenciaService;

    @Value("${app.public-url:}")
    private String publicUrl;

    public ConfiguracaoCrmService(
            ConfiguracaoCrmRepository     repository,
            ClienteService                clienteService,
            SecurityUtils                 securityUtils,
            WhatsappEvolutionClient       evolutionClient,
            CrmLembretePendenciaService   lembretePendenciaService
    ) {
        this.repository               = repository;
        this.clienteService           = clienteService;
        this.securityUtils            = securityUtils;
        this.evolutionClient          = evolutionClient;
        this.lembretePendenciaService = lembretePendenciaService;
    }

    @Transactional(readOnly = true)
    public ConfiguracaoCrmResponseDto getAtual() {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findByClienteId(clienteId)
                .map(ConfiguracaoCrmMapper::toDto)
                .orElse(null);
    }

    @Transactional
    public ConfiguracaoCrmResponseDto salvar(ConfiguracaoCrmUpsertDto dto) {
        Long    clienteId = securityUtils.getClienteIdLogado();
        Cliente cliente   = clienteService.findById(clienteId);

        ConfiguracaoCrm config = repository
                .findByClienteId(clienteId)
                .orElseGet(ConfiguracaoCrm::new);

        config.setCliente(cliente);
        config.setProvedor(dto.provedor());
        config.setApiUrl(dto.apiUrl());
        config.setInstanceName(dto.instanceName());
        config.setNumero(dto.numero());
        config.setAtivo(dto.ativo());
        config.setAtivarPendencias(dto.ativarPendencias() != null ? dto.ativarPendencias() : false);

        // Segredos: se vierem null/blank, preserva o valor atual (não sobrescreve com branco)
        if (dto.apiKey() != null && !dto.apiKey().isBlank()) {
            config.setApiKey(dto.apiKey());
        }
        if (dto.token() != null && !dto.token().isBlank()) {
            config.setToken(dto.token());
        }

        // Salva o config primeiro (precisa de id para vincular os lembretes)
        ConfiguracaoCrm salvo = repository.save(config);

        // Sincroniza os lembretes de pendência (replace-all)
        lembretePendenciaService.sincronizar(salvo, dto.lembretes());

        // Recarrega incluindo os lembretes atualizados
        ConfiguracaoCrm recarregado = repository.findById(salvo.getId()).orElse(salvo);
        return ConfiguracaoCrmMapper.toDto(recarregado);
    }

    @Transactional
    public void deletar() {
        Long clienteId = securityUtils.getClienteIdLogado();
        repository.findByClienteId(clienteId)
                .ifPresent(repository::delete);
    }

    @Transactional(readOnly = true)
    public CrmQrCodeResponseDto gerarQrCode() {
        ConfiguracaoCrm config = carregarConfigValida();

        // Cria a instância (idempotente)
        evolutionClient.criarInstancia(config.getApiUrl(), config.getInstanceName(), config.getApiKey());

        // Configura o webhook do CRM (recebimento de mensagens) — best-effort, não falha o fluxo
        if (publicUrl != null && !publicUrl.isBlank()) {
            String webhookUrl = publicUrl.replaceAll("/+$", "") + "/crm/webhook/evolution";
            evolutionClient.configurarWebhook(
                    config.getApiUrl(), config.getInstanceName(), config.getApiKey(),
                    webhookUrl, List.of("MESSAGES_UPSERT", "CONNECTION_UPDATE"));
        }

        // Conecta para obter o QR Code
        Map<?, ?> body = evolutionClient.conectar(config.getApiUrl(), config.getInstanceName(), config.getApiKey());

        String base64      = body != null && body.get("base64")      != null ? body.get("base64").toString()      : null;
        String pairingCode = body != null && body.get("pairingCode") != null ? body.get("pairingCode").toString() : null;
        String code        = body != null && body.get("code")        != null ? body.get("code").toString()        : null;

        return new CrmQrCodeResponseDto(base64, pairingCode, code);
    }

    @Transactional(readOnly = true)
    public CrmStatusResponseDto consultarStatus() {
        ConfiguracaoCrm config = carregarConfigValida();

        Map<?, ?> body = evolutionClient.estadoConexao(config.getApiUrl(), config.getInstanceName(), config.getApiKey());

        String status = null;
        if (body != null && body.get("instance") instanceof Map<?, ?> instance && instance.get("state") != null) {
            status = instance.get("state").toString();
        }

        return new CrmStatusResponseDto(status, "open".equals(status));
    }

    private ConfiguracaoCrm carregarConfigValida() {
        Long clienteId = securityUtils.getClienteIdLogado();
        ConfiguracaoCrm config = repository.findByClienteId(clienteId)
                .orElseThrow(() -> new BadRequestException("Configuração do CRM não encontrada, verifique!"));

        if (config.getApiUrl() == null || config.getApiUrl().isBlank()
                || config.getInstanceName() == null || config.getInstanceName().isBlank()
                || config.getApiKey() == null || config.getApiKey().isBlank()) {
            throw new BadRequestException("Configuração do CRM incompleta: informe URL, nome da instância e apiKey, verifique!");
        }

        return config;
    }
}
