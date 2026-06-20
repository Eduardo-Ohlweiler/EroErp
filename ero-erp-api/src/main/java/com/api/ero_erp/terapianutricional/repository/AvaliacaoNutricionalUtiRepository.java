package com.api.ero_erp.terapianutricional.repository;

import com.api.ero_erp.terapianutricional.entity.AvaliacaoNutricionalUti;
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
public interface AvaliacaoNutricionalUtiRepository extends JpaRepository<AvaliacaoNutricionalUti, Long> {

    @Query("""
        SELECT a FROM AvaliacaoNutricionalUti a
        WHERE a.cliente.id = :clienteId
          AND (:pessoaId IS NULL OR a.pessoa.id = :pessoaId)
          AND (CAST(:dataInicio AS date) IS NULL OR a.dataAvaliacao >= :dataInicio)
          AND (CAST(:dataFim AS date) IS NULL OR a.dataAvaliacao <= :dataFim)
        """)
    Page<AvaliacaoNutricionalUti> findAllWithFilters(
            Pageable pageable,
            @Param("clienteId")  Long      clienteId,
            @Param("pessoaId")   Long      pessoaId,
            @Param("dataInicio") LocalDate dataInicio,
            @Param("dataFim")    LocalDate dataFim
    );

    @Query("""
        SELECT a FROM AvaliacaoNutricionalUti a
        WHERE a.id = :id
          AND a.cliente.id = :clienteId
        """)
    Optional<AvaliacaoNutricionalUti> findByIdAndClienteId(
            @Param("id")        Long id,
            @Param("clienteId") Long clienteId
    );

    @Query("""
        SELECT a FROM AvaliacaoNutricionalUti a
        JOIN FETCH a.pessoa p
        LEFT JOIN FETCH a.formulaEnteral f
        WHERE a.cliente.id = :clienteId
          AND (:pessoaId IS NULL OR a.pessoa.id = :pessoaId)
          AND a.dataAvaliacao BETWEEN :desde AND :ate
        ORDER BY a.dataAvaliacao ASC
        """)
    List<AvaliacaoNutricionalUti> findForDashboard(
            @Param("clienteId") Long      clienteId,
            @Param("pessoaId")  Long      pessoaId,
            @Param("desde")     LocalDate desde,
            @Param("ate")       LocalDate ate
    );

    @Query("""
        SELECT a FROM AvaliacaoNutricionalUti a
        JOIN FETCH a.pessoa p
        WHERE a.cliente.id = :clienteId
          AND a.dataAvaliacao BETWEEN :desde AND :ate
        ORDER BY a.dataAvaliacao ASC
        """)
    List<AvaliacaoNutricionalUti> findForDashboardGeral(
            @Param("clienteId") Long      clienteId,
            @Param("desde")     LocalDate desde,
            @Param("ate")       LocalDate ate
    );
}
