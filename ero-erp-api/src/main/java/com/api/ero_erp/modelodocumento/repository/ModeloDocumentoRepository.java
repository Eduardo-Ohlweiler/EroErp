package com.api.ero_erp.modelodocumento.repository;

import com.api.ero_erp.modelodocumento.dtos.ModeloDocumentoSelectDto;
import com.api.ero_erp.modelodocumento.entity.ModeloDocumento;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ModeloDocumentoRepository extends JpaRepository<ModeloDocumento, Long> {

    @Query("""
        SELECT m FROM ModeloDocumento m
        LEFT JOIN FETCH m.cliente
        LEFT JOIN FETCH m.createdBy
        LEFT JOIN FETCH m.updatedBy
        WHERE m.id = :id AND m.cliente.id = :clienteId
    """)
    Optional<ModeloDocumento> findByIdAndClienteId(
            @Param("id")        Long id,
            @Param("clienteId") Long clienteId
    );

    @Query("""
        SELECT m FROM ModeloDocumento m
        WHERE m.cliente.id = :clienteId
          AND (:nome  IS NULL OR LOWER(m.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
          AND (:ativo IS NULL OR m.ativo = :ativo)
    """)
    Page<ModeloDocumento> findAllWithFilters(
            Pageable pageable,
            @Param("clienteId") Long    clienteId,
            @Param("nome")      String  nome,
            @Param("ativo")     Boolean ativo
    );

    @Query("""
        SELECT new com.api.ero_erp.modelodocumento.dtos.ModeloDocumentoSelectDto(m.id, m.nome)
        FROM ModeloDocumento m
        WHERE m.cliente.id = :clienteId
          AND m.ativo = true
        ORDER BY m.nome
    """)
    List<ModeloDocumentoSelectDto> findAllSelectByClienteId(
            @Param("clienteId") Long clienteId
    );

    boolean existsByNomeIgnoreCaseAndClienteId(String nome, Long clienteId);

    boolean existsByNomeIgnoreCaseAndClienteIdAndIdNot(String nome, Long clienteId, Long id);
}
