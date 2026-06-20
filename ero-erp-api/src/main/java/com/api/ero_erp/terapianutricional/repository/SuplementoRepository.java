package com.api.ero_erp.terapianutricional.repository;

import com.api.ero_erp.terapianutricional.entity.Suplemento;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SuplementoRepository extends JpaRepository<Suplemento, Long> {

    @Query("""
        SELECT s FROM Suplemento s
        WHERE (s.cliente.id = :clienteId OR s.cliente IS NULL)
          AND (:nome IS NULL OR LOWER(s.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
          AND (:ativo IS NULL OR s.ativo = :ativo)
        """)
    Page<Suplemento> findAllWithFilters(
            Pageable pageable,
            @Param("clienteId") Long    clienteId,
            @Param("nome")      String  nome,
            @Param("ativo")     Boolean ativo
    );

    @Query("""
        SELECT s FROM Suplemento s
        WHERE (s.cliente.id = :clienteId OR s.cliente IS NULL)
          AND s.ativo = true
        ORDER BY s.nome
        """)
    List<Suplemento> findForSelect(@Param("clienteId") Long clienteId);

    @Query("""
        SELECT s FROM Suplemento s
        WHERE s.id = :id
          AND (s.cliente.id = :clienteId OR s.cliente IS NULL)
        """)
    Optional<Suplemento> findByIdAndClienteIdOrGlobal(
            @Param("id")        Long id,
            @Param("clienteId") Long clienteId
    );

    @Query("""
        SELECT s FROM Suplemento s
        WHERE s.id = :id
          AND s.cliente.id = :clienteId
        """)
    Optional<Suplemento> findByIdAndClienteId(
            @Param("id")        Long id,
            @Param("clienteId") Long clienteId
    );
}
