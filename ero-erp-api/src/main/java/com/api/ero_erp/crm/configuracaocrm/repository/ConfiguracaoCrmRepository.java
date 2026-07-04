package com.api.ero_erp.crm.configuracaocrm.repository;

import com.api.ero_erp.crm.configuracaocrm.entity.ConfiguracaoCrm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConfiguracaoCrmRepository extends JpaRepository<ConfiguracaoCrm, Long> {
    Optional<ConfiguracaoCrm> findByClienteId(Long clienteId);

    Optional<ConfiguracaoCrm> findByInstanceName(String instanceName);

    java.util.List<ConfiguracaoCrm> findByAtivarPendenciasTrue();
}
