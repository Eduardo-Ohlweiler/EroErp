package com.api.ero_erp.configuracaopendencias.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.cliente.service.ClienteService;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.configuracaopendencias.dtos.ConfiguracaoPendenciasResponseDto;
import com.api.ero_erp.configuracaopendencias.dtos.ConfiguracaoPendenciasUpsertDto;
import com.api.ero_erp.configuracaopendencias.entity.ConfiguracaoPendencias;
import com.api.ero_erp.configuracaopendencias.mapper.ConfiguracaoPendenciasMapper;
import com.api.ero_erp.configuracaopendencias.repository.ConfiguracaoPendenciasRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConfiguracaoPendenciasService {

    private final ConfiguracaoPendenciasRepository repository;
    private final ClienteService                   clienteService;
    private final SecurityUtils                    securityUtils;

    public ConfiguracaoPendenciasService(
            ConfiguracaoPendenciasRepository repository,
            ClienteService                   clienteService,
            SecurityUtils                    securityUtils
    ) {
        this.repository     = repository;
        this.clienteService = clienteService;
        this.securityUtils  = securityUtils;
    }

    @Transactional(readOnly = true)
    public ConfiguracaoPendenciasResponseDto getAtual() {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findByClienteId(clienteId)
                .map(ConfiguracaoPendenciasMapper::toDto)
                .orElse(null);
    }

    @Transactional
    public ConfiguracaoPendenciasResponseDto salvar(ConfiguracaoPendenciasUpsertDto dto) {
        Long    clienteId = securityUtils.getClienteIdLogado();
        Cliente cliente   = clienteService.findById(clienteId);

        ConfiguracaoPendencias config = repository
                .findByClienteId(clienteId)
                .orElseGet(ConfiguracaoPendencias::new);

        config.setCliente(cliente);
        config.setDiasAntes(dto.diasAntes());
        config.setNotificarClientesVencimento(dto.notificarClientesVencimento());
        config.setMensagemAviso(dto.mensagemAviso());

        return ConfiguracaoPendenciasMapper.toDto(repository.save(config));
    }

    @Transactional
    public void deletar() {
        Long clienteId = securityUtils.getClienteIdLogado();
        repository.findByClienteId(clienteId)
                .ifPresent(repository::delete);
    }
}
