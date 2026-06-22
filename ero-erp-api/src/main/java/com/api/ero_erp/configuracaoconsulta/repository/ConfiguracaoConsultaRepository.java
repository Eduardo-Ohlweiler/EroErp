package com.api.ero_erp.configuracaoconsulta.repository;

import com.api.ero_erp.configuracaoconsulta.entity.ConfiguracaoConsulta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConfiguracaoConsultaRepository extends JpaRepository<ConfiguracaoConsulta, Long> {
    Optional<ConfiguracaoConsulta> findByClienteId(Long clienteId);
}
