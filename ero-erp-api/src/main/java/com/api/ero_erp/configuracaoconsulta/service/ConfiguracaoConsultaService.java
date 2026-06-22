package com.api.ero_erp.configuracaoconsulta.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.cliente.service.ClienteService;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.configuracaoconsulta.dtos.ConfiguracaoConsultaResponseDto;
import com.api.ero_erp.configuracaoconsulta.dtos.ConfiguracaoConsultaUpsertDto;
import com.api.ero_erp.configuracaoconsulta.entity.ConfiguracaoConsulta;
import com.api.ero_erp.configuracaoconsulta.mapper.ConfiguracaoConsultaMapper;
import com.api.ero_erp.configuracaoconsulta.repository.ConfiguracaoConsultaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConfiguracaoConsultaService {

    private final ConfiguracaoConsultaRepository repository;
    private final ClienteService                 clienteService;
    private final SecurityUtils                  securityUtils;

    public ConfiguracaoConsultaService(
            ConfiguracaoConsultaRepository repository,
            ClienteService                 clienteService,
            SecurityUtils                  securityUtils
    ) {
        this.repository     = repository;
        this.clienteService = clienteService;
        this.securityUtils  = securityUtils;
    }

    @Transactional(readOnly = true)
    public ConfiguracaoConsultaResponseDto getAtual() {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findByClienteId(clienteId)
                .map(ConfiguracaoConsultaMapper::toDto)
                .orElse(null);
    }

    @Transactional
    public ConfiguracaoConsultaResponseDto salvar(ConfiguracaoConsultaUpsertDto dto) {
        Long    clienteId = securityUtils.getClienteIdLogado();
        Cliente cliente   = clienteService.findById(clienteId);

        ConfiguracaoConsulta config = repository
                .findByClienteId(clienteId)
                .orElseGet(ConfiguracaoConsulta::new);

        config.setCliente(cliente);
        config.setFaturarAoConcluir(dto.faturarAoConcluir());

        return ConfiguracaoConsultaMapper.toDto(repository.save(config));
    }

    @Transactional
    public void deletar() {
        Long clienteId = securityUtils.getClienteIdLogado();
        repository.findByClienteId(clienteId)
                .ifPresent(repository::delete);
    }
}
