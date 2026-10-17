package com.api.ero_erp.servico.repository;

import com.api.ero_erp.servico.entity.ServicoFilial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ServicoFilialRepository extends JpaRepository<ServicoFilial, UUID> {

    List<ServicoFilial> findAllByServicoIdAndTenantId(UUID servicoId, UUID tenantId);
}
