package com.api.ero_erp.clinica.repository;

import com.api.ero_erp.clinica.entity.Consulta;
import com.api.ero_erp.clinica.enums.StatusConsulta;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface ConsultaRepository extends JpaRepository<Consulta, Long> {

    @Query("""
            SELECT c FROM Consulta c
            JOIN FETCH c.emitente e JOIN FETCH e.pessoa
            JOIN FETCH c.pessoa
            WHERE c.id = :id
            AND c.cliente.id = :clienteId
            """)
    Optional<Consulta> findByIdAndClienteId(
            @Param("id")        Long id,
            @Param("clienteId") Long clienteId
    );

    @Query("""
            SELECT c FROM Consulta c
            JOIN FETCH c.emitente e JOIN FETCH e.pessoa
            JOIN FETCH c.pessoa p
            WHERE c.cliente.id = :clienteId
            AND (:status IS NULL OR c.status = :status)
            AND (:emitenteId IS NULL OR c.emitente.id = :emitenteId)
            AND (:pessoaId IS NULL OR c.pessoa.id = :pessoaId)
            AND (:inicio IS NULL OR c.inicio >= :inicio)
            AND (:fim IS NULL OR c.inicio <= :fim)
            AND (:nomePessoa IS NULL OR LOWER(p.nome) LIKE LOWER(CONCAT('%', CAST(:nomePessoa AS string), '%')))
            ORDER BY c.createdAt DESC
            """)
    Page<Consulta> findAllWithFilters(
            Pageable pageable,
            @Param("clienteId")  Long           clienteId,
            @Param("status")     StatusConsulta status,
            @Param("emitenteId") Long           emitenteId,
            @Param("pessoaId")   Long           pessoaId,
            @Param("inicio")     LocalDateTime  inicio,
            @Param("fim")        LocalDateTime  fim,
            @Param("nomePessoa") String         nomePessoa
    );
}
