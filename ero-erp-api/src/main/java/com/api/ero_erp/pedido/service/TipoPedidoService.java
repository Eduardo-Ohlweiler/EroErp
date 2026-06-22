package com.api.ero_erp.pedido.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.pedido.dtos.TipoPedidoCreateDto;
import com.api.ero_erp.pedido.dtos.TipoPedidoResponseDto;
import com.api.ero_erp.pedido.dtos.TipoPedidoSummaryDto;
import com.api.ero_erp.pedido.entity.TipoPedido;
import com.api.ero_erp.pedido.mapper.TipoPedidoMapper;
import com.api.ero_erp.pedido.repository.TipoPedidoRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TipoPedidoService {

    private final TipoPedidoRepository tipoPedidoRepository;
    private final SecurityUtils        securityUtils;

    public TipoPedidoService(TipoPedidoRepository tipoPedidoRepository, SecurityUtils securityUtils) {
        this.tipoPedidoRepository = tipoPedidoRepository;
        this.securityUtils        = securityUtils;
    }

    // ── Leitura ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<TipoPedidoSummaryDto> getAll(Pageable pageable, String nome) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return tipoPedidoRepository.findAllWithFilters(pageable, clienteId, nome)
                .map(TipoPedidoMapper::toSummaryDto);
    }

    @Transactional(readOnly = true)
    public List<TipoPedidoSummaryDto> findAtivos() {
        Long clienteId = securityUtils.getClienteIdLogado();
        return tipoPedidoRepository.findAtivos(clienteId).stream()
                .map(TipoPedidoMapper::toSummaryDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public TipoPedidoResponseDto findByIdResponse(Long id) {
        Long       clienteId  = securityUtils.getClienteIdLogado();
        TipoPedido tipoPedido = tipoPedidoRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Tipo de pedido não encontrado, verifique!"));
        return TipoPedidoMapper.toResponseDto(tipoPedido);
    }

    // ── Escrita ───────────────────────────────────────────────────────────────

    @Transactional
    public TipoPedidoResponseDto create(TipoPedidoCreateDto dto) {
        Cliente cliente = securityUtils.getClienteLogado();

        TipoPedido tipoPedido = new TipoPedido();
        tipoPedido.setCliente(cliente);
        tipoPedido.setNome(dto.nome());
        tipoPedido.setMovimentaEstoque(dto.movimentaEstoque());
        tipoPedido.setGeraFinanceiro(dto.geraFinanceiro());

        TipoPedido salvo = tipoPedidoRepository.save(tipoPedido);
        if (dto.ativo() != null) salvo.setAtivo(dto.ativo());

        return TipoPedidoMapper.toResponseDto(tipoPedidoRepository.save(salvo));
    }

    @Transactional
    public TipoPedidoResponseDto update(Long id, TipoPedidoCreateDto dto) {
        Long       clienteId  = securityUtils.getClienteIdLogado();
        TipoPedido tipoPedido = tipoPedidoRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Tipo de pedido não encontrado, verifique!"));

        if (dto.nome() != null && !dto.nome().isBlank()) tipoPedido.setNome(dto.nome());
        if (dto.movimentaEstoque() != null)              tipoPedido.setMovimentaEstoque(dto.movimentaEstoque());
        if (dto.geraFinanceiro()   != null)              tipoPedido.setGeraFinanceiro(dto.geraFinanceiro());
        if (dto.ativo()            != null)              tipoPedido.setAtivo(dto.ativo());

        return TipoPedidoMapper.toResponseDto(tipoPedidoRepository.save(tipoPedido));
    }

    @Transactional
    public void delete(Long id) {
        Long       clienteId  = securityUtils.getClienteIdLogado();
        TipoPedido tipoPedido = tipoPedidoRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Tipo de pedido não encontrado, verifique!"));
        tipoPedidoRepository.delete(tipoPedido);
    }
}
