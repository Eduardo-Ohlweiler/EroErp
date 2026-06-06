package com.api.ero_erp.financeiro.lancamento.repository;

import com.api.ero_erp.financeiro.lancamento.entity.LancamentoFinanceiro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LancamentoFinanceiroRepository extends JpaRepository<LancamentoFinanceiro, Long> {

    List<LancamentoFinanceiro> findAllByClienteIdOrderByDataDescIdDesc(Long clienteId);

    Optional<LancamentoFinanceiro> findByIdAndClienteId(Long id, Long clienteId);

    @Query("SELECT l FROM LancamentoFinanceiro l WHERE l.cliente.id = :clienteId ORDER BY l.data DESC")
    List<LancamentoFinanceiro> findByClienteId(@Param("clienteId") Long clienteId);
}
