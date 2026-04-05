package com.api.ero_erp.role.repository;

import com.api.ero_erp.role.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {

    boolean existsByNomeIgnoreCase(String nome);

    Optional<Role> findByNomeIgnoreCase(String nome);
}
