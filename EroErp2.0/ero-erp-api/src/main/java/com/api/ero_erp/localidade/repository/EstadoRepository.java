package com.api.ero_erp.localidade.repository;

import com.api.ero_erp.localidade.entity.Estado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EstadoRepository extends JpaRepository<Estado, UUID> {

    List<Estado> findAllByAtivoTrueOrderByNome();
}
