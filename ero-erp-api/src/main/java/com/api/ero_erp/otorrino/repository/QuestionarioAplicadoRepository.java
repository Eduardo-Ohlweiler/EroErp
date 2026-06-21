package com.api.ero_erp.otorrino.repository;

import com.api.ero_erp.otorrino.entity.QuestionarioAplicado;
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
public interface QuestionarioAplicadoRepository extends JpaRepository<QuestionarioAplicado, Long> {

    @Query("""
        SELECT a FROM QuestionarioAplicado a
        WHERE a.cliente.id = :clienteId
          AND (:pessoaId IS NULL OR a.pessoa.id = :pessoaId)
          AND (CAST(:codigo AS string) IS NULL
               OR UPPER(CAST(a.questionario.codigo AS string)) = UPPER(CAST(:codigo AS string)))
        ORDER BY a.dataAplicacao DESC
        """)
    Page<QuestionarioAplicado> findAllWithFilters(
            Pageable pageable,
            @Param("clienteId") Long   clienteId,
            @Param("pessoaId")  Long   pessoaId,
            @Param("codigo")    String codigo
    );

    @Query("""
        SELECT a FROM QuestionarioAplicado a
        JOIN FETCH a.pessoa
        JOIN FETCH a.questionario
        LEFT JOIN FETCH a.usuario
        WHERE a.id = :id
          AND a.cliente.id = :clienteId
        """)
    Optional<QuestionarioAplicado> findByIdAndClienteId(
            @Param("id")        Long id,
            @Param("clienteId") Long clienteId
    );

    @Query("""
        SELECT a FROM QuestionarioAplicado a
        JOIN FETCH a.pessoa
        JOIN FETCH a.questionario
        WHERE a.cliente.id = :clienteId
          AND a.pessoa.id = :pessoaId
        ORDER BY a.dataAplicacao DESC
        """)
    List<QuestionarioAplicado> findByPessoaIdAndClienteId(
            @Param("pessoaId")  Long pessoaId,
            @Param("clienteId") Long clienteId
    );

    @Query("""
        SELECT a FROM QuestionarioAplicado a
        JOIN FETCH a.pessoa
        JOIN FETCH a.questionario
        WHERE a.cliente.id = :clienteId
          AND a.consulta.id = :consultaId
        ORDER BY a.dataAplicacao DESC
        """)
    List<QuestionarioAplicado> findByConsultaIdAndClienteId(
            @Param("consultaId") Long consultaId,
            @Param("clienteId")  Long clienteId
    );

    // ── Dashboard ──────────────────────────────────────────────────────────────

    @Query("""
        SELECT a FROM QuestionarioAplicado a
        JOIN FETCH a.pessoa
        JOIN FETCH a.questionario
        WHERE a.cliente.id = :clienteId
          AND a.pessoa.id = :pessoaId
          AND a.dataAplicacao >= :dataInicio
          AND a.dataAplicacao <= :dataFim
        ORDER BY a.dataAplicacao ASC
        """)
    List<QuestionarioAplicado> findByPessoaIdAndClienteIdAndDataAplicacaoBetween(
            @Param("pessoaId")   Long      pessoaId,
            @Param("clienteId")  Long      clienteId,
            @Param("dataInicio") LocalDate dataInicio,
            @Param("dataFim")    LocalDate dataFim
    );

    @Query("""
        SELECT a FROM QuestionarioAplicado a
        JOIN FETCH a.pessoa
        JOIN FETCH a.questionario
        WHERE a.cliente.id = :clienteId
          AND a.dataAplicacao >= :dataInicio
          AND a.dataAplicacao <= :dataFim
        ORDER BY a.dataAplicacao ASC
        """)
    List<QuestionarioAplicado> findByClienteIdAndDataAplicacaoBetween(
            @Param("clienteId")  Long      clienteId,
            @Param("dataInicio") LocalDate dataInicio,
            @Param("dataFim")    LocalDate dataFim
    );
}
