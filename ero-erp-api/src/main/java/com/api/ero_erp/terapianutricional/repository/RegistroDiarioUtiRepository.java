package com.api.ero_erp.terapianutricional.repository;

import com.api.ero_erp.terapianutricional.entity.RegistroDiarioUti;
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
public interface RegistroDiarioUtiRepository extends JpaRepository<RegistroDiarioUti, Long> {

    @Query("""
        SELECT r FROM RegistroDiarioUti r
        WHERE r.cliente.id = :clienteId
          AND (:pessoaId IS NULL OR r.pessoa.id = :pessoaId)
          AND (CAST(:dataInicio AS date) IS NULL OR r.data >= :dataInicio)
          AND (CAST(:dataFim AS date) IS NULL OR r.data <= :dataFim)
        """)
    Page<RegistroDiarioUti> findAllWithFilters(
            Pageable pageable,
            @Param("clienteId")  Long      clienteId,
            @Param("pessoaId")   Long      pessoaId,
            @Param("dataInicio") LocalDate dataInicio,
            @Param("dataFim")    LocalDate dataFim
    );

    @Query("""
        SELECT r FROM RegistroDiarioUti r
        WHERE r.id = :id
          AND r.cliente.id = :clienteId
        """)
    Optional<RegistroDiarioUti> findByIdAndClienteId(
            @Param("id")        Long id,
            @Param("clienteId") Long clienteId
    );

    @Query("""
        SELECT r FROM RegistroDiarioUti r
        JOIN FETCH r.pessoa p
        WHERE r.cliente.id = :clienteId
          AND (:pessoaId IS NULL OR r.pessoa.id = :pessoaId)
          AND r.data BETWEEN :desde AND :ate
        ORDER BY r.data ASC
        """)
    List<RegistroDiarioUti> findForDashboard(
            @Param("clienteId") Long      clienteId,
            @Param("pessoaId")  Long      pessoaId,
            @Param("desde")     LocalDate desde,
            @Param("ate")       LocalDate ate
    );
}
