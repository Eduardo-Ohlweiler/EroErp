package com.api.ero_erp.otorrino.repository;

import com.api.ero_erp.otorrino.entity.ExameLaudo;
import com.api.ero_erp.otorrino.enums.TipoExameLaudo;
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
public interface ExameLaudoRepository extends JpaRepository<ExameLaudo, Long> {

    @Query("""
        SELECT e FROM ExameLaudo e
        WHERE e.cliente.id = :clienteId
          AND (:pessoaId IS NULL OR e.pessoa.id = :pessoaId)
          AND (CAST(:dataInicio AS date) IS NULL OR e.dataExame >= :dataInicio)
          AND (CAST(:dataFim AS date) IS NULL OR e.dataExame <= :dataFim)
          AND (:tipoExame IS NULL OR e.tipoExame = :tipoExame)
          AND (CAST(:nome AS string) IS NULL
               OR LOWER(e.pessoa.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
        ORDER BY e.dataExame DESC
        """)
    Page<ExameLaudo> findAllWithFilters(
            Pageable pageable,
            @Param("clienteId")  Long           clienteId,
            @Param("pessoaId")   Long           pessoaId,
            @Param("dataInicio") LocalDate      dataInicio,
            @Param("dataFim")    LocalDate      dataFim,
            @Param("tipoExame")  TipoExameLaudo tipoExame,
            @Param("nome")       String         nome
    );

    @Query("""
        SELECT e FROM ExameLaudo e
        JOIN FETCH e.pessoa
        LEFT JOIN FETCH e.usuario
        WHERE e.id = :id
          AND e.cliente.id = :clienteId
        """)
    Optional<ExameLaudo> findByIdAndClienteId(
            @Param("id")        Long id,
            @Param("clienteId") Long clienteId
    );

    @Query("""
        SELECT e FROM ExameLaudo e
        JOIN FETCH e.pessoa
        WHERE e.cliente.id = :clienteId
          AND e.pessoa.id = :pessoaId
        ORDER BY e.dataExame DESC
        """)
    List<ExameLaudo> findByPessoaIdAndClienteId(
            @Param("pessoaId")  Long pessoaId,
            @Param("clienteId") Long clienteId
    );

    @Query("""
        SELECT e FROM ExameLaudo e
        JOIN FETCH e.pessoa
        WHERE e.cliente.id = :clienteId
          AND e.consulta.id = :consultaId
        ORDER BY e.dataExame DESC
        """)
    List<ExameLaudo> findByConsultaIdAndClienteId(
            @Param("consultaId") Long consultaId,
            @Param("clienteId")  Long clienteId
    );

    // ── Dashboard ──────────────────────────────────────────────────────────────

    @Query("""
        SELECT e FROM ExameLaudo e
        JOIN FETCH e.pessoa
        WHERE e.cliente.id = :clienteId
          AND e.pessoa.id = :pessoaId
          AND e.dataExame >= :dataInicio
          AND e.dataExame <= :dataFim
        ORDER BY e.dataExame ASC
        """)
    List<ExameLaudo> findByPessoaIdAndClienteIdAndDataExameBetween(
            @Param("pessoaId")   Long      pessoaId,
            @Param("clienteId")  Long      clienteId,
            @Param("dataInicio") LocalDate dataInicio,
            @Param("dataFim")    LocalDate dataFim
    );

    @Query("""
        SELECT e FROM ExameLaudo e
        JOIN FETCH e.pessoa
        WHERE e.cliente.id = :clienteId
          AND e.dataExame >= :dataInicio
          AND e.dataExame <= :dataFim
        ORDER BY e.dataExame ASC
        """)
    List<ExameLaudo> findByClienteIdAndDataExameBetween(
            @Param("clienteId")  Long      clienteId,
            @Param("dataInicio") LocalDate dataInicio,
            @Param("dataFim")    LocalDate dataFim
    );
}
