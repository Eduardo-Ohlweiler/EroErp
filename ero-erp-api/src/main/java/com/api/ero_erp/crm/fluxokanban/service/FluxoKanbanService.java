package com.api.ero_erp.crm.fluxokanban.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.cliente.service.ClienteService;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.crm.andamento.entity.Andamento;
import com.api.ero_erp.crm.andamento.repository.AndamentoRepository;
import com.api.ero_erp.crm.configuracaocrm.entity.ConfiguracaoCrm;
import com.api.ero_erp.crm.configuracaocrm.repository.ConfiguracaoCrmRepository;
import com.api.ero_erp.crm.fluxokanban.dtos.FluxoKanbanColunaItemDto;
import com.api.ero_erp.crm.fluxokanban.dtos.FluxoKanbanColunaResponseDto;
import com.api.ero_erp.crm.fluxokanban.entity.FluxoKanbanColuna;
import com.api.ero_erp.crm.fluxokanban.mapper.FluxoKanbanColunaMapper;
import com.api.ero_erp.crm.fluxokanban.repository.FluxoKanbanColunaRepository;
import com.api.ero_erp.exceptions.BadRequestException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FluxoKanbanService {

    private final FluxoKanbanColunaRepository fluxoKanbanColunaRepository;
    private final AndamentoRepository         andamentoRepository;
    private final ConfiguracaoCrmRepository   configuracaoCrmRepository;
    private final ClienteService              clienteService;
    private final SecurityUtils               securityUtils;

    public FluxoKanbanService(
            FluxoKanbanColunaRepository fluxoKanbanColunaRepository,
            AndamentoRepository         andamentoRepository,
            ConfiguracaoCrmRepository   configuracaoCrmRepository,
            ClienteService              clienteService,
            SecurityUtils               securityUtils
    ) {
        this.fluxoKanbanColunaRepository = fluxoKanbanColunaRepository;
        this.andamentoRepository         = andamentoRepository;
        this.configuracaoCrmRepository   = configuracaoCrmRepository;
        this.clienteService              = clienteService;
        this.securityUtils               = securityUtils;
    }

    @Transactional(readOnly = true)
    public List<FluxoKanbanColunaResponseDto> getFluxo() {
        Long clienteId = securityUtils.getClienteIdLogado();
        return fluxoKanbanColunaRepository.findByClienteIdOrderByOrdemAsc(clienteId)
                .stream()
                .map(FluxoKanbanColunaMapper::toDto)
                .toList();
    }

    @Transactional
    public List<FluxoKanbanColunaResponseDto> salvar(List<FluxoKanbanColunaItemDto> itens) {
        Long    clienteId = securityUtils.getClienteIdLogado();
        Cliente cliente   = clienteService.findById(clienteId);

        boolean ativarPendencias = configuracaoCrmRepository.findByClienteId(clienteId)
                .map(cfg -> Boolean.TRUE.equals(cfg.getAtivarPendencias()))
                .orElse(false);

        // Remove as colunas atuais do cliente e força o flush antes de reinserir
        // (unique cliente_id + andamento_id impediria reinserção antes do delete efetivar)
        fluxoKanbanColunaRepository.deleteByClienteId(clienteId);
        fluxoKanbanColunaRepository.flush();

        if (itens == null || itens.isEmpty()) {
            return List.of();
        }

        for (int i = 0; i < itens.size(); i++) {
            FluxoKanbanColunaItemDto dto = itens.get(i);

            Andamento andamento = andamentoRepository.findById(dto.andamentoId())
                    .orElseThrow(() -> new BadRequestException("Andamento não encontrado, verifique!"));

            // Visível ao cliente: global (cliente null) ou do próprio cliente
            boolean visivel = andamento.getCliente() == null
                    || andamento.getCliente().getId().equals(clienteId);
            if (!visivel)
                throw new BadRequestException("Andamento não pertence ao cliente, verifique!");

            if (!Boolean.TRUE.equals(andamento.getAtivo()))
                throw new BadRequestException("Andamento inativo não pode ser adicionado ao fluxo kanban");

            if ("PENDENTE".equals(andamento.getChave()) && !ativarPendencias)
                throw new BadRequestException("Ative as pendências na configuração do CRM para usar a coluna Pendente");

            Integer ordem = dto.ordem() != null ? dto.ordem() : i;

            FluxoKanbanColuna coluna = new FluxoKanbanColuna();
            coluna.setCliente(cliente);
            coluna.setAndamento(andamento);
            coluna.setOrdem(ordem);
            fluxoKanbanColunaRepository.save(coluna);
        }

        return fluxoKanbanColunaRepository.findByClienteIdOrderByOrdemAsc(clienteId)
                .stream()
                .map(FluxoKanbanColunaMapper::toDto)
                .toList();
    }
}
