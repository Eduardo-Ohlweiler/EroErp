package com.api.ero_erp.estoque.repository;

import com.api.ero_erp.estoque.entity.EstoqueMovimentacao;
import com.api.ero_erp.estoque.enums.TipoMovimentacao;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EstoqueMovimentacaoRepository extends JpaRepository<EstoqueMovimentacao, Long> {

    @Query("""
        SELECT m FROM EstoqueMovimentacao m
        JOIN FETCH m.cliente
        JOIN FETCH m.estoque
        JOIN FETCH m.emitente em JOIN FETCH em.pessoa
        JOIN FETCH m.produto
        LEFT JOIN FETCH m.transferencia
        LEFT JOIN FETCH m.createdBy
        WHERE m.cliente.id = :clienteId
          AND (:estoqueId IS NULL OR m.estoque.id = :estoqueId)
          AND (:emitenteId IS NULL OR m.emitente.id = :emitenteId)
          AND (:tipo IS NULL OR m.tipo = :tipo)
    """)
    Page<EstoqueMovimentacao> findAllWithFilters(
            Pageable pageable,
            @Param("clienteId")  Long               clienteId,
            @Param("estoqueId")  Long               estoqueId,
            @Param("emitenteId") Long               emitenteId,
            @Param("tipo")       TipoMovimentacao   tipo
    );
}
