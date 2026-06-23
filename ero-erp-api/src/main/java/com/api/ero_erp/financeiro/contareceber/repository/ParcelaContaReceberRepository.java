package com.api.ero_erp.financeiro.contareceber.repository;

import com.api.ero_erp.financeiro.contareceber.entity.ParcelaContaReceber;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ParcelaContaReceberRepository extends JpaRepository<ParcelaContaReceber, Long> {

    @Query("""
        SELECT p FROM ParcelaContaReceber p
        LEFT JOIN FETCH p.formaPagamento
        LEFT JOIN FETCH p.contaFinanceira
        WHERE p.id = :id AND p.contaReceber.cliente.id = :clienteId
    """)
    Optional<ParcelaContaReceber> findByIdAndClienteId(@Param("id") Long id, @Param("clienteId") Long clienteId);

    @Query("""
        SELECT p FROM ParcelaContaReceber p
        JOIN FETCH p.contaReceber c
        JOIN FETCH c.pessoa pes
        LEFT JOIN FETCH c.emitente e
        LEFT JOIN FETCH e.pessoa ep
        LEFT JOIN FETCH p.formaPagamento
        LEFT JOIN FETCH p.contaFinanceira
        WHERE c.cliente.id = :clienteId
          AND (:emitenteId IS NULL OR e.id = :emitenteId)
          AND (:pessoaId IS NULL OR pes.id = :pessoaId)
          AND (:status IS NULL OR CAST(p.status AS string) = :status)
          AND (CAST(:dataVencDe AS date) IS NULL OR p.dataVencimento >= :dataVencDe)
          AND (CAST(:dataVencAte AS date) IS NULL OR p.dataVencimento <= :dataVencAte)
        ORDER BY p.dataVencimento ASC
    """)
    List<ParcelaContaReceber> findForPagarContas(
            @Param("clienteId") Long clienteId,
            @Param("emitenteId") Long emitenteId,
            @Param("pessoaId") Long pessoaId,
            @Param("status") String status,
            @Param("dataVencDe") LocalDate dataVencDe,
            @Param("dataVencAte") LocalDate dataVencAte
    );

    @Query("""
        SELECT p FROM ParcelaContaReceber p
        JOIN FETCH p.contaReceber c
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
    List<ParcelaContaReceber> findForDashboard(
            @Param("clienteId") Long clienteId,
            @Param("status") String status,
            @Param("dataInicio") LocalDate dataInicio,
            @Param("dataFim") LocalDate dataFim
    );

    // Fluxo de caixa (regime CAIXA) — parcelas efetivamente recebidas no periodo (status PAGO).
    // Filtros opcionais por emitente e conta financeira. JOIN FETCH para evitar lazy.
    @Query("""
        SELECT p FROM ParcelaContaReceber p
        JOIN FETCH p.contaReceber cr
        JOIN FETCH cr.pessoa
        LEFT JOIN FETCH cr.emitente em
        LEFT JOIN FETCH em.pessoa
        LEFT JOIN FETCH p.contaFinanceira
        WHERE cr.cliente.id = :clienteId
          AND p.status = com.api.ero_erp.financeiro.enums.StatusConta.PAGO
          AND (p.credito = false OR p.credito IS NULL)
          AND p.dataPagamento BETWEEN :ini AND :fim
          AND (:emitenteId IS NULL OR cr.emitente.id = :emitenteId)
          AND (:contaId IS NULL OR p.contaFinanceira.id = :contaId)
    """)
    List<ParcelaContaReceber> findRecebidasNoPeriodo(
            @Param("clienteId") Long clienteId,
            @Param("ini") LocalDate ini,
            @Param("fim") LocalDate fim,
            @Param("emitenteId") Long emitenteId,
            @Param("contaId") Long contaId
    );
}
