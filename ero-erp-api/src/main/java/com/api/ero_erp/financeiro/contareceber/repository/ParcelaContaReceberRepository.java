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
          AND (:dataVencDe IS NULL OR p.dataVencimento >= :dataVencDe)
          AND (:dataVencAte IS NULL OR p.dataVencimento <= :dataVencAte)
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
}
