package com.api.ero_erp.grupoacesso.service;

import com.api.ero_erp.exceptions.ConflictException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.grupoacesso.dtos.GrupoAcessoCreateDto;
import com.api.ero_erp.grupoacesso.dtos.GrupoAcessoResponseDto;
import com.api.ero_erp.grupoacesso.dtos.GrupoAcessoUpdateDto;
import com.api.ero_erp.grupoacesso.entity.GrupoAcesso;
import com.api.ero_erp.grupoacesso.mapper.GrupoAcessoMapper;
import com.api.ero_erp.grupoacesso.repository.GrupoAcessoRepository;
import com.api.ero_erp.role.entity.Role;
import com.api.ero_erp.role.repository.RoleRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class GrupoAcessoService {

    private final GrupoAcessoRepository grupoAcessoRepository;
    private final RoleRepository        roleRepository;
    private final GrupoAcessoMapper     grupoAcessoMapper;

    public GrupoAcessoService(
            GrupoAcessoRepository grupoAcessoRepository,
            RoleRepository        roleRepository,
            GrupoAcessoMapper     grupoAcessoMapper
    ) {
        this.grupoAcessoRepository = grupoAcessoRepository;
        this.roleRepository        = roleRepository;
        this.grupoAcessoMapper     = grupoAcessoMapper;
    }

    @Transactional(readOnly = true)
    public GrupoAcesso findById(Long id) {
        return grupoAcessoRepository.findByIdWithRoles(id)
                .orElseThrow(() -> new NotFoundException("Grupo de acesso não encontrado"));
    }

    @Transactional(readOnly = true)
    public GrupoAcessoResponseDto findByIdResponse(Long id) {
        return grupoAcessoMapper.toDTO(this.findById(id));
    }

    @Transactional(readOnly = true)
    public List<GrupoAcessoResponseDto> select() {
        return grupoAcessoRepository.findAllByOrderByNomeAsc()
                .stream()
                .map(grupoAcessoMapper::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<GrupoAcessoResponseDto> getAll(Pageable pageable, String nome) {
        return grupoAcessoRepository.findAllWithFilters(pageable, nome)
                .map(grupoAcessoMapper::toDTO);
    }

    @Transactional
    public GrupoAcessoResponseDto create(GrupoAcessoCreateDto dto) {
        if (grupoAcessoRepository.existsByNomeIgnoreCase(dto.nome()))
            throw new ConflictException("Já existe grupo de acesso cadastrado com esse nome");

        GrupoAcesso grupo = new GrupoAcesso();
        grupo.setNome(dto.nome());

        if (dto.descricao() != null && !dto.descricao().isBlank())
            grupo.setDescricao(dto.descricao());

        if (dto.roleIds() != null)
            grupo.setRoles(this.resolveRoles(dto.roleIds()));

        return grupoAcessoMapper.toDTO(grupoAcessoRepository.save(grupo));
    }

    @Transactional
    public GrupoAcessoResponseDto update(Long id, GrupoAcessoUpdateDto dto) {
        GrupoAcesso grupo = this.findById(id);

        if (dto.nome() != null && !dto.nome().isBlank()) {
            Optional<GrupoAcesso> salvo = grupoAcessoRepository.findByNomeIgnoreCase(dto.nome());

            if (salvo.isPresent() && !salvo.get().getId().equals(id))
                throw new ConflictException("Já existe outro grupo de acesso cadastrado com esse nome");

            grupo.setNome(dto.nome());
        }

        if (dto.descricao() != null)
            grupo.setDescricao(dto.descricao().isBlank() ? null : dto.descricao());

        if (dto.roleIds() != null)
            grupo.setRoles(this.resolveRoles(dto.roleIds()));

        return grupoAcessoMapper.toDTO(grupoAcessoRepository.save(grupo));
    }

    @Transactional
    public void delete(Long id) {
        grupoAcessoRepository.delete(this.findById(id));
    }

    private Set<Role> resolveRoles(Set<String> nomes) {
        return nomes.stream()
                .map(nome -> roleRepository.findByNomeIgnoreCase(nome)
                        .orElseThrow(() -> new NotFoundException("Role não encontrada: " + nome)))
                .collect(Collectors.toSet());
    }
}
