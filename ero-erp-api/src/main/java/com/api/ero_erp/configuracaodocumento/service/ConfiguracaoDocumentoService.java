package com.api.ero_erp.configuracaodocumento.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.cliente.service.ClienteService;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.configuracaodocumento.dtos.ConfiguracaoDocumentoResponseDto;
import com.api.ero_erp.configuracaodocumento.dtos.ConfiguracaoDocumentoUpsertDto;
import com.api.ero_erp.configuracaodocumento.entity.ConfiguracaoDocumento;
import com.api.ero_erp.configuracaodocumento.mapper.ConfiguracaoDocumentoMapper;
import com.api.ero_erp.configuracaodocumento.repository.ConfiguracaoDocumentoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConfiguracaoDocumentoService {

    private final ConfiguracaoDocumentoRepository repository;
    private final ClienteService                  clienteService;
    private final SecurityUtils                   securityUtils;

    public ConfiguracaoDocumentoService(
            ConfiguracaoDocumentoRepository repository,
            ClienteService                  clienteService,
            SecurityUtils                   securityUtils
    ) {
        this.repository     = repository;
        this.clienteService = clienteService;
        this.securityUtils  = securityUtils;
    }

    @Transactional(readOnly = true)
    public ConfiguracaoDocumentoResponseDto getAtual() {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findByClienteId(clienteId)
                .map(ConfiguracaoDocumentoMapper::toDto)
                .orElse(null);
    }

    @Transactional
    public ConfiguracaoDocumentoResponseDto salvar(ConfiguracaoDocumentoUpsertDto dto) {
        Long    clienteId = securityUtils.getClienteIdLogado();
        Cliente cliente   = clienteService.findById(clienteId);

        ConfiguracaoDocumento config = repository
                .findByClienteId(clienteId)
                .orElseGet(ConfiguracaoDocumento::new);

        config.setCliente(cliente);
        config.setAssinaturaDigital(dto.assinaturaDigital());

        return ConfiguracaoDocumentoMapper.toDto(repository.save(config));
    }

    @Transactional
    public void deletar() {
        Long clienteId = securityUtils.getClienteIdLogado();
        repository.findByClienteId(clienteId)
                .ifPresent(repository::delete);
    }
}
