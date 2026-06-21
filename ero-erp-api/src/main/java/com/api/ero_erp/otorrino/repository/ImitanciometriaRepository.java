package com.api.ero_erp.otorrino.repository;

import com.api.ero_erp.otorrino.entity.Imitanciometria;
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
public interface ImitanciometriaRepository extends JpaRepository<Imitanciometria, Long> {

    @Query("""
        SELECT i FROM Imitanciometria i
        WHERE i.cliente.id = :clienteId
          AND (:pessoaId IS NULL OR i.pessoa.id = :pessoaId)
          AND (CAST(:dataInicio AS date) IS NULL OR i.dataExame >= :dataInicio)
          AND (CAST(:dataFim AS date) IS NULL OR i.dataExame <= :dataFim)
          AND (CAST(:nome AS string) IS NULL
               OR LOWER(i.pessoa.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
        ORDER BY i.dataExame DESC
        """)
    Page<Imitanciometria> findAllWithFilters(
            Pageable pageable,
            @Param("clienteId")  Long      clienteId,
            @Param("pessoaId")   Long      pessoaId,
            @Param("dataInicio") LocalDate dataInicio,
            @Param("dataFim")    LocalDate dataFim,
            @Param("nome")       String    nome
    );

    @Query("""
        SELECT i FROM Imitanciometria i
        JOIN FETCH i.pessoa
        LEFT JOIN FETCH i.usuario
        WHERE i.id = :id
          AND i.cliente.id = :clienteId
        """)
    Optional<Imitanciometria> findByIdAndClienteId(
            @Param("id")        Long id,
            @Param("clienteId") Long clienteId
    );

    @Query("""
        SELECT i FROM Imitanciometria i
        JOIN FETCH i.pessoa
        WHERE i.cliente.id = :clienteId
          AND i.pessoa.id = :pessoaId
        ORDER BY i.dataExame DESC
        """)
    List<Imitanciometria> findByPessoaIdAndClienteId(
            @Param("pessoaId")  Long pessoaId,
            @Param("clienteId") Long clienteId
    );

    @Query("""
        SELECT i FROM Imitanciometria i
        JOIN FETCH i.pessoa
        WHERE i.cliente.id = :clienteId
          AND i.consulta.id = :consultaId
        ORDER BY i.dataExame DESC
        """)
    List<Imitanciometria> findByConsultaIdAndClienteId(
            @Param("consultaId") Long consultaId,
            @Param("clienteId")  Long clienteId
    );

    // ── Dashboard ──────────────────────────────────────────────────────────────

    @Query("""
        SELECT i FROM Imitanciometria i
        WHERE i.cliente.id = :clienteId
          AND i.pessoa.id = :pessoaId
          AND i.dataExame >= :dataInicio
          AND i.dataExame <= :dataFim
        """)
    List<Imitanciometria> findByPessoaIdAndClienteIdAndDataExameBetween(
            @Param("pessoaId")   Long      pessoaId,
            @Param("clienteId")  Long      clienteId,
            @Param("dataInicio") LocalDate dataInicio,
            @Param("dataFim")    LocalDate dataFim
    );

    @Query("""
        SELECT i FROM Imitanciometria i
        JOIN FETCH i.pessoa
        WHERE i.cliente.id = :clienteId
          AND i.dataExame >= :dataInicio
          AND i.dataExame <= :dataFim
        """)
    List<Imitanciometria> findByClienteIdAndDataExameBetween(
            @Param("clienteId")  Long      clienteId,
            @Param("dataInicio") LocalDate dataInicio,
            @Param("dataFim")    LocalDate dataFim
    );
}
