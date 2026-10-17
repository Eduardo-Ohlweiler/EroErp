package com.api.ero_erp.catalogo.repository;

import com.api.ero_erp.catalogo.entity.UnidadeMedida;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/** Catálogo global: sem {@code AndTenantId}, como os demais catálogos. */
@Repository
public interface UnidadeMedidaRepository extends JpaRepository<UnidadeMedida, UUID> {

    List<UnidadeMedida> findAllByAtivoTrueOrderBySigla();
}
