package com.api.ero_erp.role.service;

import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.role.entity.Role;
import com.api.ero_erp.role.repository.RoleRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class RoleService {

    private RoleRepository roleRepository;

    public RoleService(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    public Role findById(Long id) throws NotFoundException {
        return roleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Role não encontrada"));
    }

    public Page<Role> getAll(Pageable pageable){
        return roleRepository.findAll(pageable);
    }


}
