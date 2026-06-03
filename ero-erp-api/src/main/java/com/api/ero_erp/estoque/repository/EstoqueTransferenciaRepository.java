package com.api.ero_erp.estoque.repository;

import com.api.ero_erp.estoque.entity.EstoqueTransferencia;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EstoqueTransferenciaRepository extends JpaRepository<EstoqueTransferencia, Long> {

    @Query("""
        SELECT t FROM EstoqueTransferencia t
        JOIN FETCH t.cliente
        JOIN FETCH t.produto
        JOIN FETCH t.emitenteOrigem eo JOIN FETCH eo.pessoa
        JOIN FETCH t.emitenteDestino ed JOIN FETCH ed.pessoa
        LEFT JOIN FETCH t.createdBy
        WHERE t.cliente.id = :clienteId
          AND (:produtoId IS NULL OR t.produto.id = :produtoId)
          AND (:emitenteId IS NULL OR t.emitenteOrigem.id = :emitenteId OR t.emitenteDestino.id = :emitenteId)
    """)
    Page<EstoqueTransferencia> findAllWithFilters(
            Pageable pageable,
            @Param("clienteId")  Long clienteId,
            @Param("produtoId")  Long produtoId,
            @Param("emitenteId") Long emitenteId
    );
}
