package com.api.ero_erp.configuracaodocumento.repository;

import com.api.ero_erp.configuracaodocumento.entity.ConfiguracaoDocumento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConfiguracaoDocumentoRepository extends JpaRepository<ConfiguracaoDocumento, Long> {
    Optional<ConfiguracaoDocumento> findByClienteId(Long clienteId);
}
