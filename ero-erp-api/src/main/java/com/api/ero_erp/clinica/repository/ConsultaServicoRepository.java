package com.api.ero_erp.clinica.repository;

import com.api.ero_erp.clinica.entity.ConsultaServico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ConsultaServicoRepository extends JpaRepository<ConsultaServico, Long> {

    @Query("""
            SELECT cs FROM ConsultaServico cs
            JOIN FETCH cs.produto p
            JOIN FETCH p.tipoProduto
            WHERE cs.consulta.id = :consultaId
            AND cs.cliente.id = :clienteId
            ORDER BY cs.createdAt ASC
            """)
    List<ConsultaServico> findByConsultaIdAndClienteId(
            @Param("consultaId") Long consultaId,
            @Param("clienteId")  Long clienteId
    );

    @Query("""
            SELECT cs FROM ConsultaServico cs
            JOIN FETCH cs.produto p
            JOIN FETCH cs.consulta c
            JOIN FETCH c.pessoa
            WHERE c.cliente.id = :clienteId
            AND c.status = 'CONCLUIDA'
            AND c.inicio >= :desde
            """)
    List<ConsultaServico> findForDashboard(
            @Param("clienteId") Long          clienteId,
            @Param("desde")     LocalDateTime desde
    );

    @Query("""
            SELECT cs FROM ConsultaServico cs
            WHERE cs.id = :id
            AND cs.consulta.id = :consultaId
            AND cs.cliente.id = :clienteId
            """)
    Optional<ConsultaServico> findByIdAndConsultaIdAndClienteId(
            @Param("id")         Long id,
            @Param("consultaId") Long consultaId,
            @Param("clienteId")  Long clienteId
    );
}
