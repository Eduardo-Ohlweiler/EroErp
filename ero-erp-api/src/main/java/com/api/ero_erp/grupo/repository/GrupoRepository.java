package com.api.ero_erp.grupo.repository;

import com.api.ero_erp.grupo.entity.Grupo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GrupoRepository extends JpaRepository<Grupo, Long> {

    Optional<Grupo> findByIdAndClienteId(Long id, Long clienteId);

    @Query("""
            SELECT COUNT(g) > 0 FROM Grupo g
            WHERE LOWER(g.nome) = LOWER(:nome)
            AND g.cliente.id = :clienteId
            AND (:excludeId IS NULL OR g.id <> :excludeId)
            """)
    boolean existsByNomeAndClienteId(
            @Param("nome")      String nome,
            @Param("clienteId") Long   clienteId,
            @Param("excludeId") Long   excludeId
    );

    @Query("""
            SELECT g FROM Grupo g
            WHERE g.cliente.id = :clienteId
            AND (:ativo IS NULL OR g.ativo = :ativo)
            AND (:nome IS NULL OR LOWER(g.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
            """)
    Page<Grupo> findAllWithFilters(
            Pageable pageable,
            @Param("clienteId") Long    clienteId,
            @Param("ativo")     Boolean ativo,
            @Param("nome")      String  nome
    );

    @Query("""
            SELECT g FROM Grupo g
            WHERE g.cliente.id = :clienteId
            AND g.ativo = true
            AND (:nome IS NULL OR LOWER(g.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
            ORDER BY g.nome
            """)
    List<Grupo> findForSelect(
            @Param("clienteId") Long   clienteId,
            @Param("nome")      String nome
    );
}
