package com.api.ero_erp.estoque.repository;

import com.api.ero_erp.estoque.entity.Estoque;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface EstoqueRepository extends JpaRepository<Estoque, Long> {

    @Query("""
        SELECT e FROM Estoque e
        JOIN FETCH e.cliente
        JOIN FETCH e.emitente em JOIN FETCH em.pessoa
        JOIN FETCH e.produto p JOIN FETCH p.unidadeMedida
        LEFT JOIN FETCH e.createdBy
        LEFT JOIN FETCH e.updatedBy
        WHERE e.id = :id AND e.cliente.id = :clienteId
    """)
    Optional<Estoque> findByIdAndClienteId(@Param("id") Long id, @Param("clienteId") Long clienteId);

    boolean existsByEmitenteIdAndProdutoId(Long emitenteId, Long produtoId);

    @Query("""
        SELECT e FROM Estoque e
        JOIN FETCH e.cliente
        JOIN FETCH e.emitente em JOIN FETCH em.pessoa
        JOIN FETCH e.produto p JOIN FETCH p.unidadeMedida
        LEFT JOIN FETCH e.createdBy
        LEFT JOIN FETCH e.updatedBy
        WHERE e.cliente.id = :clienteId
          AND (:emitenteId IS NULL OR e.emitente.id = :emitenteId)
          AND (:produtoNome IS NULL OR LOWER(p.nome) LIKE LOWER(CONCAT('%', CAST(:produtoNome AS string), '%')))
          AND (:bloqueado IS NULL OR e.bloqueado = :bloqueado)
    """)
    Page<Estoque> findAllWithFilters(
            Pageable pageable,
            @Param("clienteId")   Long    clienteId,
            @Param("emitenteId")  Long    emitenteId,
            @Param("produtoNome") String  produtoNome,
            @Param("bloqueado")   Boolean bloqueado
    );

    @Query("""
        SELECT e FROM Estoque e
        JOIN FETCH e.emitente em JOIN FETCH em.pessoa
        JOIN FETCH e.produto p JOIN FETCH p.unidadeMedida
        WHERE e.emitente.id = :emitenteId AND e.produto.id = :produtoId
    """)
    Optional<Estoque> findByEmitenteIdAndProdutoId(
            @Param("emitenteId") Long emitenteId,
            @Param("produtoId")  Long produtoId
    );

    @Query("""
        SELECT e FROM Estoque e
        JOIN FETCH e.emitente em JOIN FETCH em.pessoa
        JOIN FETCH e.produto p JOIN FETCH p.unidadeMedida
        WHERE e.cliente.id = :clienteId
          AND e.bloqueado = false
          AND e.quantidadeMinima IS NOT NULL
          AND e.quantidade <= e.quantidadeMinima
        ORDER BY e.quantidade ASC
    """)
    java.util.List<Estoque> findAlertas(@Param("clienteId") Long clienteId);
}
