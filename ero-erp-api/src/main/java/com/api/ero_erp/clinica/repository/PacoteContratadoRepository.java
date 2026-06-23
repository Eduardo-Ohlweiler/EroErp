package com.api.ero_erp.clinica.repository;

import com.api.ero_erp.clinica.entity.PacoteContratado;
import com.api.ero_erp.clinica.enums.StatusPacote;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PacoteContratadoRepository extends JpaRepository<PacoteContratado, Long> {

    @Query("""
            SELECT p FROM PacoteContratado p
            JOIN FETCH p.emitente e JOIN FETCH e.pessoa
            JOIN FETCH p.pessoa
            JOIN FETCH p.produto
            WHERE p.id = :id
            AND p.cliente.id = :clienteId
            """)
    Optional<PacoteContratado> findByIdAndClienteId(
            @Param("id")        Long id,
            @Param("clienteId") Long clienteId
    );

    @Query("""
            SELECT p FROM PacoteContratado p
            JOIN FETCH p.emitente e JOIN FETCH e.pessoa
            JOIN FETCH p.pessoa pe
            JOIN FETCH p.produto
            WHERE p.cliente.id = :clienteId
            AND (:pessoaId IS NULL OR p.pessoa.id = :pessoaId)
            AND (:status   IS NULL OR p.status    = :status)
            AND (:nome     IS NULL OR LOWER(p.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
            ORDER BY p.createdAt DESC
            """)
    Page<PacoteContratado> findAllWithFilters(
            Pageable pageable,
            @Param("clienteId") Long         clienteId,
            @Param("pessoaId")  Long         pessoaId,
            @Param("status")    StatusPacote status,
            @Param("nome")      String       nome
    );
}
