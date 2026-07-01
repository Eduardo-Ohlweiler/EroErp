package com.api.ero_erp.crm.lembretependencia.repository;

import com.api.ero_erp.crm.lembretependencia.entity.CrmLembretePendencia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CrmLembretePendenciaRepository extends JpaRepository<CrmLembretePendencia, Long> {

    List<CrmLembretePendencia> findByConfiguracaoCrmIdOrderByOrdemAsc(Long configId);
}
