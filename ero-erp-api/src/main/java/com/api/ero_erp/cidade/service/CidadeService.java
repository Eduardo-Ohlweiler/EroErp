package com.api.ero_erp.cidade.service;

import com.api.ero_erp.cidade.dtos.CidadeCreateDto;
import com.api.ero_erp.cidade.dtos.CidadeResponseDto;
import com.api.ero_erp.cidade.dtos.CidadeUpdateDto;
import com.api.ero_erp.cidade.entity.Cidade;
import com.api.ero_erp.cidade.mapper.CidadeMapper;
import com.api.ero_erp.cidade.repository.CidadeRepository;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.estado.entity.Estado;
import com.api.ero_erp.estado.service.EstadoService;
import com.api.ero_erp.exceptions.ConflictException;
import com.api.ero_erp.exceptions.NotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CidadeService {

    private final CidadeRepository cidadeRepository;
    private final EstadoService    estadoService;
    private final SecurityUtils    securityUtils;
    private final CidadeMapper     cidadeMapper;

    public CidadeService(
            CidadeRepository cidadeRepository,
            EstadoService    estadoService,
            SecurityUtils    securityUtils,
            CidadeMapper     cidadeMapper
    ) {
        this.cidadeRepository = cidadeRepository;
        this.estadoService    = estadoService;
        this.securityUtils    = securityUtils;
        this.cidadeMapper     = cidadeMapper;
    }

    @Transactional(readOnly = true)
    public Cidade findById(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return cidadeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Cidade não encontrada"));
    }

    @Transactional(readOnly = true)
    public CidadeResponseDto findByIdResponse(Long id) {
        return cidadeMapper.toDTO(findById(id));
    }

    @Transactional(readOnly = true)
    public Page<CidadeResponseDto> getAll(
            Pageable pageable,
            String  nome,
            Long    estadoId,
            Integer codigoIbge,
            Boolean ativo
    ) {
        return cidadeRepository
                .findAllWithFilters(pageable, nome, estadoId, codigoIbge, ativo)
                .map(cidadeMapper::toDTO);
    }

    @Transactional(readOnly = true)
    public List<CidadeResponseDto> findForSelect(String nome) {
        return cidadeRepository.findForSelect(nome)
                .stream()
                .map(cidadeMapper::toDTO)
                .toList();
    }

    @Transactional
    public CidadeResponseDto create(CidadeCreateDto dto) {
        Cliente cliente   = securityUtils.getClienteLogado();
        Estado  estado    = estadoService.findById(dto.estadoId());

        if(cidadeRepository.existsByCodigoIbge(dto.codigoIbge()))
            throw new ConflictException("Já existe uma cidade castrada com esse código IBGE, verifique!");

        if (!estado.getAtivo())
            throw new ConflictException("Estado selecionado está inativo, verifique!");

        if (cidadeRepository.existsByNomeIgnoreCaseAndEstadoId(
                dto.nome(), dto.estadoId()))
            throw new ConflictException("Já existe uma cidade com esse nome neste estado");

        Cidade cidade = new Cidade();
        cidade.setNome(dto.nome());
        cidade.setEstado(estado);
        cidade.setCodigoIbge(dto.codigoIbge());
        if (dto.ativo() != null)
            cidade.setAtivo(dto.ativo());

        return cidadeMapper.toDTO(cidadeRepository.save(cidade));
    }

    @Transactional
    public CidadeResponseDto update(Long id, CidadeUpdateDto dto) {
        Cidade cidade    = findById(id);

        if(cidadeRepository.existsByCodigoIbge(dto.codigoIbge()))
            throw new ConflictException("Já existe uma cidade castrada com esse código IBGE, verifique!");

        if (dto.estadoId() != null) {
            Estado estado = estadoService.findById(dto.estadoId());
            if (!estado.getAtivo())
                throw new ConflictException("Estado selecionado está inativo, verifique!");
            cidade.setEstado(estado);
        }

        if (dto.nome() != null && !dto.nome().isBlank()) {
            Long estadoId = cidade.getEstado().getId();
            cidadeRepository.findByNomeAndEstadoAndCliente(dto.nome(), estadoId)
                    .ifPresent(existing -> {
                        if (!existing.getId().equals(id))
                            throw new ConflictException("Já existe outra cidade com esse nome neste estado");
                    });
            cidade.setNome(dto.nome());
        }

        if (dto.codigoIbge() != null)
            cidade.setCodigoIbge(dto.codigoIbge());

        if (dto.ativo() != null)
            cidade.setAtivo(dto.ativo());

        return cidadeMapper.toDTO(cidadeRepository.save(cidade));
    }
}