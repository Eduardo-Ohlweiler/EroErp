package com.api.ero_erp.categoria.repository;

import com.api.ero_erp.categoria.entity.Categoria;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoriaRepository extends JpaRepository<Categoria, Long> {

    Optional<Categoria> findByIdAndClienteId(Long id, Long clienteId);

    @Query("""
            SELECT COUNT(c) > 0 FROM Categoria c
            WHERE LOWER(c.nome) = LOWER(:nome)
            AND c.cliente.id = :clienteId
            AND (:excludeId IS NULL OR c.id <> :excludeId)
            """)
    boolean existsByNomeAndClienteId(
            @Param("nome")      String nome,
            @Param("clienteId") Long   clienteId,
            @Param("excludeId") Long   excludeId
    );

    @Query("""
            SELECT c FROM Categoria c
            WHERE c.cliente.id = :clienteId
            AND (:ativo IS NULL OR c.ativo = :ativo)
            AND (:nome IS NULL OR LOWER(c.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
            """)
    Page<Categoria> findAllWithFilters(
            Pageable pageable,
            @Param("clienteId") Long    clienteId,
            @Param("ativo")     Boolean ativo,
            @Param("nome")      String  nome
    );

    @Query("""
            SELECT c FROM Categoria c
            WHERE c.cliente.id = :clienteId
            AND c.ativo = true
            AND (:nome IS NULL OR LOWER(c.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
            ORDER BY c.nome
            """)
    List<Categoria> findForSelect(
            @Param("clienteId") Long   clienteId,
            @Param("nome")      String nome
    );
}
