package com.api.ero_erp.configuracaopedido.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.cliente.service.ClienteService;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.configuracaopedido.dtos.ConfiguracaoPedidoResponseDto;
import com.api.ero_erp.configuracaopedido.dtos.ConfiguracaoPedidoUpsertDto;
import com.api.ero_erp.configuracaopedido.entity.ConfiguracaoPedido;
import com.api.ero_erp.configuracaopedido.mapper.ConfiguracaoPedidoMapper;
import com.api.ero_erp.configuracaopedido.repository.ConfiguracaoPedidoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConfiguracaoPedidoService {

    private final ConfiguracaoPedidoRepository repository;
    private final ClienteService               clienteService;
    private final SecurityUtils                securityUtils;

    public ConfiguracaoPedidoService(
            ConfiguracaoPedidoRepository repository,
            ClienteService               clienteService,
            SecurityUtils                securityUtils
    ) {
        this.repository     = repository;
        this.clienteService = clienteService;
        this.securityUtils  = securityUtils;
    }

    @Transactional(readOnly = true)
    public ConfiguracaoPedidoResponseDto getAtual() {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findByClienteId(clienteId)
                .map(ConfiguracaoPedidoMapper::toDto)
                .orElse(null);
    }

    @Transactional
    public ConfiguracaoPedidoResponseDto salvar(ConfiguracaoPedidoUpsertDto dto) {
        Long    clienteId = securityUtils.getClienteIdLogado();
        Cliente cliente   = clienteService.findById(clienteId);

        ConfiguracaoPedido config = repository
                .findByClienteId(clienteId)
                .orElseGet(ConfiguracaoPedido::new);

        config.setCliente(cliente);
        config.setFaturarAoConcluir(dto.faturarAoConcluir());
        config.setDevolucaoGerarCredito(dto.devolucaoGerarCredito());

        return ConfiguracaoPedidoMapper.toDto(repository.save(config));
    }

    @Transactional
    public void deletar() {
        Long clienteId = securityUtils.getClienteIdLogado();
        repository.findByClienteId(clienteId)
                .ifPresent(repository::delete);
    }
}
