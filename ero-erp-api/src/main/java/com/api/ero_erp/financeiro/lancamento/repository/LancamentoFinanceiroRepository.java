package com.api.ero_erp.financeiro.lancamento.repository;

import com.api.ero_erp.financeiro.lancamento.entity.LancamentoFinanceiro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface LancamentoFinanceiroRepository extends JpaRepository<LancamentoFinanceiro, Long> {

    List<LancamentoFinanceiro> findAllByClienteIdOrderByDataDescIdDesc(Long clienteId);

    Optional<LancamentoFinanceiro> findByIdAndClienteId(Long id, Long clienteId);

    @Query("SELECT l FROM LancamentoFinanceiro l WHERE l.cliente.id = :clienteId ORDER BY l.data DESC")
    List<LancamentoFinanceiro> findByClienteId(@Param("clienteId") Long clienteId);

    // Fluxo de caixa (regime CAIXA) — lancamentos manuais no periodo (por data).
    // Filtro opcional por conta financeira. JOIN FETCH para evitar lazy.
    @Query("""
        SELECT l FROM LancamentoFinanceiro l
        JOIN FETCH l.contaFinanceira
        WHERE l.cliente.id = :clienteId
          AND l.data BETWEEN :ini AND :fim
          AND (:contaId IS NULL OR l.contaFinanceira.id = :contaId)
    """)
    List<LancamentoFinanceiro> findNoPeriodo(
            @Param("clienteId") Long clienteId,
            @Param("ini") LocalDate ini,
            @Param("fim") LocalDate fim,
            @Param("contaId") Long contaId
    );
}
