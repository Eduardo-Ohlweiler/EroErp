package com.api.ero_erp.grupo.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.cliente.service.ClienteService;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.exceptions.ConflictException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.grupo.dtos.GrupoCreateDto;
import com.api.ero_erp.grupo.dtos.GrupoResponseDto;
import com.api.ero_erp.grupo.dtos.GrupoUpdateDto;
import com.api.ero_erp.grupo.entity.Grupo;
import com.api.ero_erp.grupo.mapper.GrupoMapper;
import com.api.ero_erp.grupo.repository.GrupoRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class GrupoService {

    private final GrupoRepository grupoRepository;
    private final ClienteService  clienteService;
    private final GrupoMapper     grupoMapper;
    private final SecurityUtils   securityUtils;

    public GrupoService(
            GrupoRepository grupoRepository,
            ClienteService  clienteService,
            GrupoMapper     grupoMapper,
            SecurityUtils   securityUtils
    ) {
        this.grupoRepository = grupoRepository;
        this.clienteService  = clienteService;
        this.grupoMapper     = grupoMapper;
        this.securityUtils   = securityUtils;
    }

    @Transactional(readOnly = true)
    public Grupo findById(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return grupoRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Grupo não encontrado"));
    }

    @Transactional(readOnly = true)
    public GrupoResponseDto findByIdResponse(Long id) {
        return grupoMapper.toDto(findById(id));
    }

    @Transactional(readOnly = true)
    public Page<GrupoResponseDto> getAll(Pageable pageable, Boolean ativo, String nome) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return grupoRepository.findAllWithFilters(pageable, clienteId, ativo, nome)
                .map(grupoMapper::toDto);
    }

    @Transactional(readOnly = true)
    public List<GrupoResponseDto> select(String nome) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return grupoRepository.findForSelect(clienteId, nome)
                .stream()
                .map(grupoMapper::toDto)
                .toList();
    }

    @Transactional
    public GrupoResponseDto create(GrupoCreateDto dto) {
        Long    clienteId = securityUtils.getClienteIdLogado();
        Cliente cliente   = clienteService.findById(clienteId);

        if (grupoRepository.existsByNomeAndClienteId(dto.nome(), clienteId, null))
            throw new ConflictException("Já existe um grupo com o nome \"" + dto.nome() + "\"");

        Grupo grupo = new Grupo();
        grupo.setCliente(cliente);
        grupo.setNome(dto.nome());

        return grupoMapper.toDto(grupoRepository.save(grupo));
    }

    @Transactional
    public GrupoResponseDto update(Long id, GrupoUpdateDto dto) {
        Long  clienteId = securityUtils.getClienteIdLogado();
        Grupo grupo     = findById(id);

        if (grupoRepository.existsByNomeAndClienteId(dto.nome(), clienteId, id))
            throw new ConflictException("Já existe um grupo com o nome \"" + dto.nome() + "\"");

        grupo.setNome(dto.nome());
        grupo.setAtivo(dto.ativo());
        return grupoMapper.toDto(grupoRepository.save(grupo));
    }

    @Transactional
    public void delete(Long id) {
        grupoRepository.delete(findById(id));
    }
}
