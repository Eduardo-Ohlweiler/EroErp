package com.api.ero_erp.pediatria.repository;

import com.api.ero_erp.pediatria.entity.FormulaLactea;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FormulaLacteaRepository extends JpaRepository<FormulaLactea, Long> {

    @Query("""
        SELECT f FROM FormulaLactea f
        WHERE (f.cliente.id = :clienteId OR f.cliente IS NULL)
          AND (:nome IS NULL OR LOWER(f.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
          AND (:ativo IS NULL OR f.ativo = :ativo)
        """)
    Page<FormulaLactea> findAllWithFilters(
            Pageable pageable,
            @Param("clienteId") Long    clienteId,
            @Param("nome")      String  nome,
            @Param("ativo")     Boolean ativo
    );

    @Query("""
        SELECT f FROM FormulaLactea f
        WHERE (f.cliente.id = :clienteId OR f.cliente IS NULL)
          AND f.ativo = true
        ORDER BY f.nome
        """)
    List<FormulaLactea> findForSelect(@Param("clienteId") Long clienteId);

    @Query("""
        SELECT f FROM FormulaLactea f
        WHERE f.id = :id
          AND (f.cliente.id = :clienteId OR f.cliente IS NULL)
        """)
    Optional<FormulaLactea> findByIdAndClienteIdOrGlobal(
            @Param("id")        Long id,
            @Param("clienteId") Long clienteId
    );

    @Query("""
        SELECT f FROM FormulaLactea f
        WHERE f.id = :id
          AND f.cliente.id = :clienteId
        """)
    Optional<FormulaLactea> findByIdAndClienteId(
            @Param("id")        Long id,
            @Param("clienteId") Long clienteId
    );
}
