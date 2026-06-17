package com.api.ero_erp.financeiro.contareceber.repository;

import com.api.ero_erp.financeiro.contareceber.entity.ContaReceber;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ContaReceberRepository extends JpaRepository<ContaReceber, Long> {

    @Query("""
        SELECT c FROM ContaReceber c
        LEFT JOIN FETCH c.emitente e
        LEFT JOIN FETCH e.pessoa ep
        JOIN FETCH c.pessoa p
        WHERE c.id = :id AND c.cliente.id = :clienteId
    """)
    Optional<ContaReceber> findByIdAndClienteId(@Param("id") Long id, @Param("clienteId") Long clienteId);

    @Query(value = """
        SELECT c FROM ContaReceber c
        LEFT JOIN c.emitente e
        LEFT JOIN e.pessoa ep
        JOIN c.pessoa p
        WHERE c.cliente.id = :clienteId
          AND (:emitenteId IS NULL OR e.id = :emitenteId)
          AND (:pessoaId IS NULL OR p.id = :pessoaId)
          AND (:status IS NULL OR c.status = :status)
          AND (CAST(:dataInicio AS date) IS NULL OR c.data >= :dataInicio)
          AND (CAST(:dataFim AS date) IS NULL OR c.data <= :dataFim)
          AND (:ativo IS NULL OR c.ativo = :ativo)
    """,
    countQuery = """
        SELECT count(c) FROM ContaReceber c
        LEFT JOIN c.emitente e
        JOIN c.pessoa p
        WHERE c.cliente.id = :clienteId
          AND (:emitenteId IS NULL OR e.id = :emitenteId)
          AND (:pessoaId IS NULL OR p.id = :pessoaId)
          AND (:status IS NULL OR c.status = :status)
          AND (CAST(:dataInicio AS date) IS NULL OR c.data >= :dataInicio)
          AND (CAST(:dataFim AS date) IS NULL OR c.data <= :dataFim)
          AND (:ativo IS NULL OR c.ativo = :ativo)
    """)
    Page<ContaReceber> findAllWithFilters(
            Pageable pageable,
            @Param("clienteId") Long clienteId,
            @Param("emitenteId") Long emitenteId,
            @Param("pessoaId") Long pessoaId,
            @Param("status") String status,
            @Param("dataInicio") LocalDate dataInicio,
            @Param("dataFim") LocalDate dataFim,
            @Param("ativo") Boolean ativo
    );

    // Fluxo de caixa (regime COMPETENCIA) — contas emitidas no periodo (por data de emissao).
    // Filtro opcional por emitente. JOIN FETCH para evitar lazy.
    @Query("""
        SELECT c FROM ContaReceber c
        JOIN FETCH c.pessoa
        LEFT JOIN FETCH c.emitente em
        LEFT JOIN FETCH em.pessoa
        WHERE c.cliente.id = :clienteId
          AND c.data BETWEEN :ini AND :fim
          AND (:emitenteId IS NULL OR c.emitente.id = :emitenteId)
    """)
    List<ContaReceber> findEmitidasNoPeriodo(
            @Param("clienteId") Long clienteId,
            @Param("ini") LocalDate ini,
            @Param("fim") LocalDate fim,
            @Param("emitenteId") Long emitenteId
    );
}
