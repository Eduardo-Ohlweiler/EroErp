package com.api.ero_erp.configuracaopendencias.repository;

import com.api.ero_erp.configuracaopendencias.entity.ConfiguracaoPendencias;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConfiguracaoPendenciasRepository extends JpaRepository<ConfiguracaoPendencias, Long> {

    Optional<ConfiguracaoPendencias> findByClienteId(Long clienteId);
}
