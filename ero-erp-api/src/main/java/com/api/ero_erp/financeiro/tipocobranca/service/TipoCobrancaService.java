package com.api.ero_erp.financeiro.tipocobranca.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.exceptions.ConflictException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.financeiro.tipocobranca.dtos.TipoCobrancaCreateDto;
import com.api.ero_erp.financeiro.tipocobranca.dtos.TipoCobrancaResponseDto;
import com.api.ero_erp.financeiro.tipocobranca.dtos.TipoCobrancaUpdateDto;
import com.api.ero_erp.financeiro.tipocobranca.entity.TipoCobranca;
import com.api.ero_erp.financeiro.tipocobranca.mapper.TipoCobrancaMapper;
import com.api.ero_erp.financeiro.tipocobranca.repository.TipoCobrancaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TipoCobrancaService {

    private final TipoCobrancaRepository repository;
    private final SecurityUtils          securityUtils;

    public TipoCobrancaService(TipoCobrancaRepository repository, SecurityUtils securityUtils) {
        this.repository   = repository;
        this.securityUtils = securityUtils;
    }

    @Transactional(readOnly = true)
    public TipoCobranca findById(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Tipo de cobrança não encontrado"));
    }

    @Transactional(readOnly = true)
    public Page<TipoCobrancaResponseDto> getAll(Pageable pageable, String nome, Boolean ativo) {
        Long clienteId = securityUtils.getClienteIdLogado();
        String nomeFiltro = (nome != null && !nome.isBlank()) ? nome.trim() : null;
        return repository.findAllWithFilters(pageable, clienteId, nomeFiltro, ativo)
                .map(TipoCobrancaMapper::toDto);
    }

    @Transactional(readOnly = true)
    public List<TipoCobrancaResponseDto> select() {
        Long clienteId = securityUtils.getClienteIdLogado();
        return TipoCobrancaMapper.toDtoList(repository.findForSelect(clienteId));
    }

    @Transactional
    public TipoCobrancaResponseDto create(TipoCobrancaCreateDto dto) {
        Cliente cliente = securityUtils.getClienteLogado();

        if (repository.existsByNomeIgnoreCaseAndClienteId(dto.nome(), cliente.getId()))
            throw new ConflictException("Já existe um tipo de cobrança com esse nome");

        TipoCobranca tipo = new TipoCobranca();
        tipo.setCliente(cliente);
        tipo.setNome(dto.nome());
        if (dto.ativo() != null) tipo.setAtivo(dto.ativo());

        return TipoCobrancaMapper.toDto(repository.save(tipo));
    }

    @Transactional
    public TipoCobrancaResponseDto update(Long id, TipoCobrancaUpdateDto dto) {
        TipoCobranca tipo = findById(id);

        if (dto.nome() != null && !dto.nome().isBlank()) {
            if (!dto.nome().equalsIgnoreCase(tipo.getNome()) &&
                    repository.existsByNomeIgnoreCaseAndClienteId(dto.nome(), tipo.getCliente().getId()))
                throw new ConflictException("Já existe outro tipo de cobrança com esse nome");
            tipo.setNome(dto.nome());
        }

        if (dto.ativo() != null) tipo.setAtivo(dto.ativo());

        return TipoCobrancaMapper.toDto(repository.save(tipo));
    }
}
