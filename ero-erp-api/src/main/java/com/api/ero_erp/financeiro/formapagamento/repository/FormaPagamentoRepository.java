package com.api.ero_erp.financeiro.formapagamento.repository;

import com.api.ero_erp.financeiro.formapagamento.entity.FormaPagamento;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FormaPagamentoRepository extends JpaRepository<FormaPagamento, Long> {

    @Query("SELECT f FROM FormaPagamento f JOIN FETCH f.tipoCobranca JOIN FETCH f.contaFinanceira WHERE f.id = :id AND f.cliente.id = :clienteId")
    Optional<FormaPagamento> findByIdAndClienteId(@Param("id") Long id, @Param("clienteId") Long clienteId);

    boolean existsByNomeIgnoreCaseAndClienteId(String nome, Long clienteId);

    @Query("""
        SELECT f FROM FormaPagamento f
        JOIN FETCH f.tipoCobranca
        JOIN FETCH f.contaFinanceira
        WHERE f.cliente.id = :clienteId
          AND (:nome IS NULL OR LOWER(f.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
          AND (:ativo IS NULL OR f.ativo = :ativo)
    """)
    Page<FormaPagamento> findAllWithFilters(
            Pageable pageable,
            @Param("clienteId") Long clienteId,
            @Param("nome") String nome,
            @Param("ativo") Boolean ativo
    );

    @Query("""
        SELECT f FROM FormaPagamento f
        JOIN FETCH f.tipoCobranca
        JOIN FETCH f.contaFinanceira
        WHERE f.cliente.id = :clienteId
          AND f.ativo = true
        ORDER BY f.nome
    """)
    List<FormaPagamento> findForSelect(@Param("clienteId") Long clienteId);
}
