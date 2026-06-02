package com.api.ero_erp.marca.repository;

import com.api.ero_erp.marca.entity.Marca;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MarcaRepository extends JpaRepository<Marca, Long> {

    Optional<Marca> findByIdAndClienteId(Long id, Long clienteId);

    @Query("""
            SELECT COUNT(m) > 0 FROM Marca m
            WHERE LOWER(m.nome) = LOWER(:nome)
            AND m.cliente.id = :clienteId
            AND (:excludeId IS NULL OR m.id <> :excludeId)
            """)
    boolean existsByNomeAndClienteId(
            @Param("nome")      String nome,
            @Param("clienteId") Long   clienteId,
            @Param("excludeId") Long   excludeId
    );

    @Query("""
            SELECT m FROM Marca m
            WHERE m.cliente.id = :clienteId
            AND (:ativo IS NULL OR m.ativo = :ativo)
            AND (:nome IS NULL OR LOWER(m.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
            """)
    Page<Marca> findAllWithFilters(
            Pageable pageable,
            @Param("clienteId") Long    clienteId,
            @Param("ativo")     Boolean ativo,
            @Param("nome")      String  nome
    );

    @Query("""
            SELECT m FROM Marca m
            WHERE m.cliente.id = :clienteId
            AND m.ativo = true
            AND (:nome IS NULL OR LOWER(m.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
            ORDER BY m.nome
            """)
    List<Marca> findForSelect(
            @Param("clienteId") Long   clienteId,
            @Param("nome")      String nome
    );
}
