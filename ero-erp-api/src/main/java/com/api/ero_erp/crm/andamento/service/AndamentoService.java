package com.api.ero_erp.crm.andamento.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.cliente.service.ClienteService;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.crm.andamento.dtos.AndamentoResponseDto;
import com.api.ero_erp.crm.andamento.dtos.AndamentoUpsertDto;
import com.api.ero_erp.crm.andamento.entity.Andamento;
import com.api.ero_erp.crm.andamento.mapper.AndamentoMapper;
import com.api.ero_erp.crm.andamento.repository.AndamentoRepository;
import com.api.ero_erp.crm.fluxokanban.repository.FluxoKanbanColunaRepository;
import com.api.ero_erp.exceptions.BadRequestException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.exceptions.UnauthorizedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AndamentoService {

    private final AndamentoRepository         andamentoRepository;
    private final FluxoKanbanColunaRepository fluxoKanbanColunaRepository;
    private final ClienteService              clienteService;
    private final SecurityUtils               securityUtils;

    public AndamentoService(
            AndamentoRepository         andamentoRepository,
            FluxoKanbanColunaRepository fluxoKanbanColunaRepository,
            ClienteService              clienteService,
            SecurityUtils               securityUtils
    ) {
        this.andamentoRepository         = andamentoRepository;
        this.fluxoKanbanColunaRepository = fluxoKanbanColunaRepository;
        this.clienteService              = clienteService;
        this.securityUtils               = securityUtils;
    }

    @Transactional(readOnly = true)
    public List<AndamentoResponseDto> listar() {
        Long clienteId = securityUtils.getClienteIdLogado();
        return andamentoRepository.listarParaTela(clienteId)
                .stream()
                .map(AndamentoMapper::toDto)
                .toList();
    }

    @Transactional
    public AndamentoResponseDto criar(AndamentoUpsertDto dto) {
        Long    clienteId = securityUtils.getClienteIdLogado();
        Cliente cliente   = clienteService.findById(clienteId);

        Andamento andamento = new Andamento();
        andamento.setCliente(cliente);
        andamento.setSistema(false);
        andamento.setChave(null);
        andamento.setNome(dto.nome() != null ? dto.nome().trim() : null);
        andamento.setAtivo(dto.ativo() != null ? dto.ativo() : true);
        andamento.setConcluiAtendimento(dto.concluiAtendimento() != null ? dto.concluiAtendimento() : false);
        andamento.setCancelaAtendimento(dto.cancelaAtendimento() != null ? dto.cancelaAtendimento() : false);
        andamento.setCor(dto.cor());

        return AndamentoMapper.toDto(andamentoRepository.save(andamento));
    }

    @Transactional
    public AndamentoResponseDto atualizar(Long id, AndamentoUpsertDto dto) {
        Andamento andamento = andamentoRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Andamento não encontrado, verifique!"));

        if (Boolean.TRUE.equals(andamento.getSistema()))
            throw new UnauthorizedException("Andamento padrão não pode ser alterado");

        Long clienteId = securityUtils.getClienteIdLogado();
        Andamento doCliente = andamentoRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Andamento não encontrado, verifique!"));

        // Não permite alterar chave/sistema
        if (dto.nome() != null && !dto.nome().isBlank()) doCliente.setNome(dto.nome().trim());
        if (dto.ativo() != null)                         doCliente.setAtivo(dto.ativo());
        if (dto.concluiAtendimento() != null)            doCliente.setConcluiAtendimento(dto.concluiAtendimento());
        if (dto.cancelaAtendimento() != null)            doCliente.setCancelaAtendimento(dto.cancelaAtendimento());
        doCliente.setCor(dto.cor());

        return AndamentoMapper.toDto(andamentoRepository.save(doCliente));
    }

    @Transactional
    public void deletar(Long id) {
        Andamento andamento = andamentoRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Andamento não encontrado, verifique!"));

        if (Boolean.TRUE.equals(andamento.getSistema()))
            throw new UnauthorizedException("Andamento padrão não pode ser excluído");

        Long clienteId = securityUtils.getClienteIdLogado();
        Andamento doCliente = andamentoRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Andamento não encontrado, verifique!"));

        if (fluxoKanbanColunaRepository.existsByAndamentoId(doCliente.getId()))
            throw new BadRequestException("Andamento em uso no fluxo kanban");

        andamentoRepository.delete(doCliente);
    }
}
