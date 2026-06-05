package com.api.ero_erp.financeiro.tipocobranca.repository;

import com.api.ero_erp.financeiro.tipocobranca.entity.TipoCobranca;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TipoCobrancaRepository extends JpaRepository<TipoCobranca, Long> {

    Optional<TipoCobranca> findByIdAndClienteId(Long id, Long clienteId);

    boolean existsByNomeIgnoreCaseAndClienteId(String nome, Long clienteId);

    @Query("""
        SELECT t FROM TipoCobranca t
        WHERE t.cliente.id = :clienteId
          AND (:nome IS NULL OR LOWER(t.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
          AND (:ativo IS NULL OR t.ativo = :ativo)
    """)
    Page<TipoCobranca> findAllWithFilters(
            Pageable pageable,
            @Param("clienteId") Long clienteId,
            @Param("nome") String nome,
            @Param("ativo") Boolean ativo
    );

    @Query("""
        SELECT t FROM TipoCobranca t
        WHERE t.cliente.id = :clienteId
          AND t.ativo = true
        ORDER BY t.nome
    """)
    List<TipoCobranca> findForSelect(@Param("clienteId") Long clienteId);
}
