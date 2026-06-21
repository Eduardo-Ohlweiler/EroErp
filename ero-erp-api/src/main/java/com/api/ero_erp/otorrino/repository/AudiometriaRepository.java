package com.api.ero_erp.otorrino.repository;

import com.api.ero_erp.otorrino.entity.Audiometria;
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
public interface AudiometriaRepository extends JpaRepository<Audiometria, Long> {

    @Query("""
        SELECT a FROM Audiometria a
        WHERE a.cliente.id = :clienteId
          AND (:pessoaId IS NULL OR a.pessoa.id = :pessoaId)
          AND (CAST(:dataInicio AS date) IS NULL OR a.dataExame >= :dataInicio)
          AND (CAST(:dataFim AS date) IS NULL OR a.dataExame <= :dataFim)
          AND (CAST(:nome AS string) IS NULL
               OR LOWER(a.pessoa.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
        ORDER BY a.dataExame DESC
        """)
    Page<Audiometria> findAllWithFilters(
            Pageable pageable,
            @Param("clienteId")  Long      clienteId,
            @Param("pessoaId")   Long      pessoaId,
            @Param("dataInicio") LocalDate dataInicio,
            @Param("dataFim")    LocalDate dataFim,
            @Param("nome")       String    nome
    );

    @Query("""
        SELECT a FROM Audiometria a
        JOIN FETCH a.pessoa
        LEFT JOIN FETCH a.usuario
        WHERE a.id = :id
          AND a.cliente.id = :clienteId
        """)
    Optional<Audiometria> findByIdAndClienteId(
            @Param("id")        Long id,
            @Param("clienteId") Long clienteId
    );

    @Query("""
        SELECT a FROM Audiometria a
        JOIN FETCH a.pessoa
        WHERE a.cliente.id = :clienteId
          AND a.pessoa.id = :pessoaId
        ORDER BY a.dataExame DESC
        """)
    List<Audiometria> findByPessoaIdAndClienteId(
            @Param("pessoaId")  Long pessoaId,
            @Param("clienteId") Long clienteId
    );

    @Query("""
        SELECT a FROM Audiometria a
        JOIN FETCH a.pessoa
        WHERE a.cliente.id = :clienteId
          AND a.consulta.id = :consultaId
        ORDER BY a.dataExame DESC
        """)
    List<Audiometria> findByConsultaIdAndClienteId(
            @Param("consultaId") Long consultaId,
            @Param("clienteId")  Long clienteId
    );

    // ── Dashboard ──────────────────────────────────────────────────────────────

    @Query("""
        SELECT a FROM Audiometria a
        JOIN FETCH a.pessoa
        WHERE a.cliente.id = :clienteId
          AND a.pessoa.id = :pessoaId
          AND a.dataExame >= :dataInicio
          AND a.dataExame <= :dataFim
        ORDER BY a.dataExame ASC
        """)
    List<Audiometria> findByPessoaIdAndClienteIdAndDataExameBetween(
            @Param("pessoaId")   Long      pessoaId,
            @Param("clienteId")  Long      clienteId,
            @Param("dataInicio") LocalDate dataInicio,
            @Param("dataFim")    LocalDate dataFim
    );

    @Query("""
        SELECT a FROM Audiometria a
        JOIN FETCH a.pessoa
        WHERE a.cliente.id = :clienteId
          AND a.dataExame >= :dataInicio
          AND a.dataExame <= :dataFim
        ORDER BY a.dataExame ASC
        """)
    List<Audiometria> findByClienteIdAndDataExameBetween(
            @Param("clienteId")  Long      clienteId,
            @Param("dataInicio") LocalDate dataInicio,
            @Param("dataFim")    LocalDate dataFim
    );
}
