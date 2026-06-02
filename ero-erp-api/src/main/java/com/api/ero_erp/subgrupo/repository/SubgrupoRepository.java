package com.api.ero_erp.subgrupo.repository;

import com.api.ero_erp.subgrupo.entity.Subgrupo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubgrupoRepository extends JpaRepository<Subgrupo, Long> {

    @Query("""
            SELECT COUNT(s) > 0 FROM Subgrupo s
            WHERE LOWER(s.nome) = LOWER(:nome)
            AND s.cliente.id = :clienteId
            AND s.grupo.id = :grupoId
            AND (:excludeId IS NULL OR s.id <> :excludeId)
            """)
    boolean existsByNomeAndClienteIdAndGrupoId(
            @Param("nome")      String nome,
            @Param("clienteId") Long   clienteId,
            @Param("grupoId")   Long   grupoId,
            @Param("excludeId") Long   excludeId
    );

    @Query("""
            SELECT s FROM Subgrupo s
            JOIN FETCH s.grupo
            WHERE s.id = :id
            AND s.cliente.id = :clienteId
            """)
    Optional<Subgrupo> findByIdAndClienteId(
            @Param("id")        Long id,
            @Param("clienteId") Long clienteId
    );

    @Query("""
            SELECT s FROM Subgrupo s
            JOIN FETCH s.grupo
            WHERE s.cliente.id = :clienteId
            AND (:grupoId IS NULL OR s.grupo.id = :grupoId)
            AND (:ativo IS NULL OR s.ativo = :ativo)
            AND (:nome IS NULL OR LOWER(s.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
            """)
    Page<Subgrupo> findAllWithFilters(
            Pageable pageable,
            @Param("clienteId") Long    clienteId,
            @Param("grupoId")   Long    grupoId,
            @Param("ativo")     Boolean ativo,
            @Param("nome")      String  nome
    );

    @Query("""
            SELECT s FROM Subgrupo s
            JOIN FETCH s.grupo
            WHERE s.cliente.id = :clienteId
            AND (:grupoId IS NULL OR s.grupo.id = :grupoId)
            AND s.ativo = true
            AND (:nome IS NULL OR LOWER(s.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
            ORDER BY s.nome
            """)
    List<Subgrupo> findForSelect(
            @Param("clienteId") Long   clienteId,
            @Param("grupoId")   Long   grupoId,
            @Param("nome")      String nome
    );
}
