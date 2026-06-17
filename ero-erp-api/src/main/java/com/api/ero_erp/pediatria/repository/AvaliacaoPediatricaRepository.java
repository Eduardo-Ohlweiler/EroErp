package com.api.ero_erp.pediatria.repository;

import com.api.ero_erp.pediatria.entity.AvaliacaoPediatrica;
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
public interface AvaliacaoPediatricaRepository extends JpaRepository<AvaliacaoPediatrica, Long> {

    @Query("""
        SELECT a FROM AvaliacaoPediatrica a
        WHERE a.cliente.id = :clienteId
          AND (:pessoaId IS NULL OR a.pessoa.id = :pessoaId)
          AND (CAST(:dataInicio AS date) IS NULL OR a.dataAvaliacao >= :dataInicio)
          AND (CAST(:dataFim AS date) IS NULL OR a.dataAvaliacao <= :dataFim)
          AND (:formulaLacteaId IS NULL OR a.formulaLactea.id = :formulaLacteaId)
          AND (:mesesMin IS NULL OR a.idadeMeses >= :mesesMin)
          AND (:mesesMax IS NULL OR a.idadeMeses <= :mesesMax)
        """)
    Page<AvaliacaoPediatrica> findAllWithFilters(
            Pageable pageable,
            @Param("clienteId")       Long      clienteId,
            @Param("pessoaId")        Long      pessoaId,
            @Param("dataInicio")      LocalDate dataInicio,
            @Param("dataFim")         LocalDate dataFim,
            @Param("formulaLacteaId") Long      formulaLacteaId,
            @Param("mesesMin")        Integer   mesesMin,
            @Param("mesesMax")        Integer   mesesMax
    );

    @Query("""
        SELECT a FROM AvaliacaoPediatrica a
        WHERE a.id = :id
          AND a.cliente.id = :clienteId
        """)
    Optional<AvaliacaoPediatrica> findByIdAndClienteId(
            @Param("id")        Long id,
            @Param("clienteId") Long clienteId
    );

    @Query("""
        SELECT a FROM AvaliacaoPediatrica a
        JOIN FETCH a.pessoa p
        LEFT JOIN FETCH a.formulaLactea f
        WHERE a.cliente.id = :clienteId
          AND (:pessoaId IS NULL OR a.pessoa.id = :pessoaId)
          AND a.dataAvaliacao BETWEEN :desde AND :ate
          AND (:formulaLacteaId IS NULL OR a.formulaLactea.id = :formulaLacteaId)
          AND (:mesesMin IS NULL OR a.idadeMeses >= :mesesMin)
          AND (:mesesMax IS NULL OR a.idadeMeses <= :mesesMax)
          AND (:sexo IS NULL OR UPPER(a.sexo) = UPPER(CAST(:sexo AS string)))
        ORDER BY a.idadeMeses ASC, a.dataAvaliacao ASC
        """)
    List<AvaliacaoPediatrica> findForDashboard(
            @Param("clienteId")       Long      clienteId,
            @Param("pessoaId")        Long      pessoaId,
            @Param("desde")           LocalDate desde,
            @Param("ate")             LocalDate ate,
            @Param("formulaLacteaId") Long      formulaLacteaId,
            @Param("mesesMin")        Integer   mesesMin,
            @Param("mesesMax")        Integer   mesesMax,
            @Param("sexo")            String    sexo
    );
}
