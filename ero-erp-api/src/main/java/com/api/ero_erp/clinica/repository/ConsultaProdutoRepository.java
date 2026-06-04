package com.api.ero_erp.clinica.repository;

import com.api.ero_erp.clinica.entity.ConsultaProduto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConsultaProdutoRepository extends JpaRepository<ConsultaProduto, Long> {

    @Query("""
            SELECT cp FROM ConsultaProduto cp
            JOIN FETCH cp.produto p
            JOIN FETCH p.tipoProduto
            JOIN FETCH cp.emitente em JOIN FETCH em.pessoa
            WHERE cp.consulta.id = :consultaId
            AND cp.cliente.id = :clienteId
            ORDER BY cp.createdAt ASC
            """)
    List<ConsultaProduto> findByConsultaIdAndClienteId(
            @Param("consultaId") Long consultaId,
            @Param("clienteId")  Long clienteId
    );

    @Query("""
            SELECT cp FROM ConsultaProduto cp
            WHERE cp.id = :id
            AND cp.consulta.id = :consultaId
            AND cp.cliente.id = :clienteId
            """)
    Optional<ConsultaProduto> findByIdAndConsultaIdAndClienteId(
            @Param("id")         Long id,
            @Param("consultaId") Long consultaId,
            @Param("clienteId")  Long clienteId
    );

    @Query("""
            SELECT cp FROM ConsultaProduto cp
            JOIN FETCH cp.produto p
            JOIN FETCH cp.emitente
            WHERE cp.consulta.id = :consultaId
            AND p.baixarEstoque = true
            """)
    List<ConsultaProduto> findParaBaixarEstoque(@Param("consultaId") Long consultaId);
}
