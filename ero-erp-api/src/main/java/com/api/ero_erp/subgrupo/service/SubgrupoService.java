package com.api.ero_erp.subgrupo.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.cliente.service.ClienteService;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.exceptions.ConflictException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.grupo.entity.Grupo;
import com.api.ero_erp.grupo.service.GrupoService;
import com.api.ero_erp.subgrupo.dtos.SubgrupoCreateDto;
import com.api.ero_erp.subgrupo.dtos.SubgrupoResponseDto;
import com.api.ero_erp.subgrupo.dtos.SubgrupoUpdateDto;
import com.api.ero_erp.subgrupo.entity.Subgrupo;
import com.api.ero_erp.subgrupo.mapper.SubgrupoMapper;
import com.api.ero_erp.subgrupo.repository.SubgrupoRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SubgrupoService {

    private final SubgrupoRepository subgrupoRepository;
    private final ClienteService     clienteService;
    private final GrupoService       grupoService;
    private final SubgrupoMapper     subgrupoMapper;
    private final SecurityUtils      securityUtils;

    public SubgrupoService(
            SubgrupoRepository subgrupoRepository,
            ClienteService     clienteService,
            GrupoService       grupoService,
            SubgrupoMapper     subgrupoMapper,
            SecurityUtils      securityUtils
    ) {
        this.subgrupoRepository = subgrupoRepository;
        this.clienteService     = clienteService;
        this.grupoService       = grupoService;
        this.subgrupoMapper     = subgrupoMapper;
        this.securityUtils      = securityUtils;
    }

    @Transactional(readOnly = true)
    public Subgrupo findById(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return subgrupoRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Subgrupo não encontrado"));
    }

    @Transactional(readOnly = true)
    public SubgrupoResponseDto findByIdResponse(Long id) {
        return subgrupoMapper.toDto(findById(id));
    }

    @Transactional(readOnly = true)
    public Page<SubgrupoResponseDto> getAll(Pageable pageable, Long grupoId, Boolean ativo, String nome) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return subgrupoRepository.findAllWithFilters(pageable, clienteId, grupoId, ativo, nome)
                .map(subgrupoMapper::toDto);
    }

    @Transactional(readOnly = true)
    public List<SubgrupoResponseDto> select(Long grupoId, String nome) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return subgrupoRepository.findForSelect(clienteId, grupoId, nome)
                .stream()
                .map(subgrupoMapper::toDto)
                .toList();
    }

    @Transactional
    public SubgrupoResponseDto create(SubgrupoCreateDto dto) {
        Long    clienteId = securityUtils.getClienteIdLogado();
        Cliente cliente   = clienteService.findById(clienteId);
        Grupo   grupo     = grupoService.findById(dto.grupoId());

        if (subgrupoRepository.existsByNomeAndClienteIdAndGrupoId(dto.nome(), clienteId, dto.grupoId(), null))
            throw new ConflictException("Já existe um subgrupo com o nome \"" + dto.nome() + "\" neste grupo");

        Subgrupo subgrupo = new Subgrupo();
        subgrupo.setCliente(cliente);
        subgrupo.setGrupo(grupo);
        subgrupo.setNome(dto.nome());

        return subgrupoMapper.toDto(subgrupoRepository.save(subgrupo));
    }

    @Transactional
    public SubgrupoResponseDto update(Long id, SubgrupoUpdateDto dto) {
        Long     clienteId = securityUtils.getClienteIdLogado();
        Subgrupo subgrupo  = findById(id);
        Grupo    grupo     = grupoService.findById(dto.grupoId());

        if (subgrupoRepository.existsByNomeAndClienteIdAndGrupoId(dto.nome(), clienteId, dto.grupoId(), id))
            throw new ConflictException("Já existe um subgrupo com o nome \"" + dto.nome() + "\" neste grupo");

        subgrupo.setGrupo(grupo);
        subgrupo.setNome(dto.nome());
        subgrupo.setAtivo(dto.ativo());

        return subgrupoMapper.toDto(subgrupoRepository.save(subgrupo));
    }

    @Transactional
    public void delete(Long id) {
        subgrupoRepository.delete(findById(id));
    }
}
