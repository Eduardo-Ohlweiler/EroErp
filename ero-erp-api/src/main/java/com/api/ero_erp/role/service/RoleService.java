package com.api.ero_erp.role.service;

import com.api.ero_erp.exceptions.ConflictException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.role.dtos.RoleCreateDto;
import com.api.ero_erp.role.dtos.RoleUpdateDto;
import com.api.ero_erp.role.entity.Role;
import com.api.ero_erp.role.repository.RoleRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class RoleService {

    private RoleRepository roleRepository;

    public RoleService(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @Transactional(readOnly = true)
    public Role findById(Long id) throws NotFoundException {
        return roleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Role não encontrada"));
    }

    @Transactional(readOnly = true)
    public Page<Role> getAll(Pageable pageable){
        return roleRepository.findAll(pageable);
    }

    @Transactional
    public void delete(Long id) {
        Role role = this.findById(id);
        this.roleRepository.delete(role);
    }

    @Transactional
    public Role create(RoleCreateDto roleCreateDto){
        if(this.roleRepository.existsByNomeIgnoreCase(roleCreateDto.getNome()))
            throw new ConflictException("Já existe role cadastrada com esse nome");

        Role role = new Role();
        role.setNome(roleCreateDto.getNome());
        if(roleCreateDto.getDescricao() != null &&!roleCreateDto.getDescricao().isEmpty())
            role.setDescricao(roleCreateDto.getDescricao());

         return this.roleRepository.save(role);
    }

    @Transactional
    public Role update(Long id, RoleUpdateDto dto) {
        Role role = this.findById(id);

        if (dto.getNome() != null && !dto.getNome().isBlank()) {
            Optional<Role> salvo = this.roleRepository.findByNomeIgnoreCase(dto.getNome());

            if (salvo.isPresent() && !salvo.get().getId().equals(id))
                throw new ConflictException("Já existe outra role cadastrada com esse nome");

            role.setNome(dto.getNome());
        }

        if (dto.getDescricao() != null && !dto.getDescricao().isBlank())
            role.setDescricao(dto.getDescricao());

        return this.roleRepository.save(role);
    }
}
