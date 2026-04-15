package com.api.ero_erp.cliente.repository;

import com.api.ero_erp.cliente.entity.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente,Long> {

    boolean existsByEmailIgnoreCase(String email);

    Optional<Cliente> findByEmailIgnoreCase(String email);
}
