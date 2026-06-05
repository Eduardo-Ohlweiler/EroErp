package com.api.ero_erp.financeiro.contafinanceira.repository;

import com.api.ero_erp.financeiro.contafinanceira.entity.ContaFinanceira;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContaFinanceiraRepository extends JpaRepository<ContaFinanceira, Long> {

    Optional<ContaFinanceira> findByIdAndClienteId(Long id, Long clienteId);

    boolean existsByNomeIgnoreCaseAndClienteId(String nome, Long clienteId);

    @Query("""
        SELECT c FROM ContaFinanceira c
        WHERE c.cliente.id = :clienteId
          AND (:nome IS NULL OR LOWER(c.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
          AND (:ativo IS NULL OR c.ativo = :ativo)
    """)
    Page<ContaFinanceira> findAllWithFilters(
            Pageable pageable,
            @Param("clienteId") Long clienteId,
            @Param("nome") String nome,
            @Param("ativo") Boolean ativo
    );

    @Query("""
        SELECT c FROM ContaFinanceira c
        WHERE c.cliente.id = :clienteId
          AND c.ativo = true
        ORDER BY c.nome
    """)
    List<ContaFinanceira> findForSelect(@Param("clienteId") Long clienteId);
}
