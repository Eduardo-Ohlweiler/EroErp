package com.api.ero_erp.financeiro.contapagar.repository;

import com.api.ero_erp.financeiro.contapagar.entity.ParcelaContaPagar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ParcelaContaPagarRepository extends JpaRepository<ParcelaContaPagar, Long> {

    @Query("""
        SELECT p FROM ParcelaContaPagar p
        LEFT JOIN FETCH p.formaPagamento
        LEFT JOIN FETCH p.contaFinanceira
        WHERE p.id = :id AND p.contaPagar.cliente.id = :clienteId
    """)
    Optional<ParcelaContaPagar> findByIdAndClienteId(@Param("id") Long id, @Param("clienteId") Long clienteId);

    @Query("""
        SELECT p FROM ParcelaContaPagar p
        JOIN FETCH p.contaPagar c
        JOIN FETCH c.pessoa pes
        LEFT JOIN FETCH c.emitente e
        LEFT JOIN FETCH e.pessoa ep
        LEFT JOIN FETCH p.formaPagamento
        LEFT JOIN FETCH p.contaFinanceira
        WHERE c.cliente.id = :clienteId
          AND (:emitenteId IS NULL OR e.id = :emitenteId)
          AND (:pessoaId IS NULL OR pes.id = :pessoaId)
          AND (:status IS NULL OR CAST(p.status AS string) = :status)
          AND (:dataVencDe IS NULL OR p.dataVencimento >= :dataVencDe)
          AND (:dataVencAte IS NULL OR p.dataVencimento <= :dataVencAte)
        ORDER BY p.dataVencimento ASC
    """)
    List<ParcelaContaPagar> findForPagarContas(
            @Param("clienteId") Long clienteId,
            @Param("emitenteId") Long emitenteId,
            @Param("pessoaId") Long pessoaId,
            @Param("status") String status,
            @Param("dataVencDe") LocalDate dataVencDe,
            @Param("dataVencAte") LocalDate dataVencAte
    );

    @Query("""
        SELECT p FROM ParcelaContaPagar p
        JOIN FETCH p.contaPagar c
        JOIN FETCH c.pessoa pes
        LEFT JOIN FETCH c.emitente e
        LEFT JOIN FETCH e.pessoa ep
        LEFT JOIN FETCH p.formaPagamento
        LEFT JOIN FETCH p.contaFinanceira
        WHERE c.cliente.id = :clienteId
          AND CAST(p.status AS string) = :status
          AND p.dataVencimento >= :dataInicio
          AND p.dataVencimento <= :dataFim
        ORDER BY p.dataVencimento ASC
    """)
    List<ParcelaContaPagar> findForDashboard(
            @Param("clienteId") Long clienteId,
            @Param("status") String status,
            @Param("dataInicio") LocalDate dataInicio,
            @Param("dataFim") LocalDate dataFim
    );

    // Fluxo de caixa (regime CAIXA) — parcelas efetivamente pagas no periodo (status PAGO).
    // Filtros opcionais por emitente e conta financeira. JOIN FETCH para evitar lazy.
    @Query("""
        SELECT p FROM ParcelaContaPagar p
        JOIN FETCH p.contaPagar cp
        JOIN FETCH cp.pessoa
        LEFT JOIN FETCH cp.emitente em
        LEFT JOIN FETCH em.pessoa
        LEFT JOIN FETCH p.contaFinanceira
        WHERE cp.cliente.id = :clienteId
          AND p.status = com.api.ero_erp.financeiro.enums.StatusConta.PAGO
          AND p.dataPagamento BETWEEN :ini AND :fim
          AND (:emitenteId IS NULL OR cp.emitente.id = :emitenteId)
          AND (:contaId IS NULL OR p.contaFinanceira.id = :contaId)
    """)
    List<ParcelaContaPagar> findPagasNoPeriodo(
            @Param("clienteId") Long clienteId,
            @Param("ini") LocalDate ini,
            @Param("fim") LocalDate fim,
            @Param("emitenteId") Long emitenteId,
            @Param("contaId") Long contaId
    );
}
