package com.api.ero_erp.clinica.repository;

import com.api.ero_erp.clinica.entity.Refeicao;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RefeicaoRepository extends JpaRepository<Refeicao, Long> {

    @Query("""
        SELECT r FROM Refeicao r
        WHERE r.cliente.id = :clienteId
          AND (:nome IS NULL OR LOWER(r.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
        """)
    Page<Refeicao> findAllWithFilters(
            Pageable pageable,
            @Param("clienteId") Long   clienteId,
            @Param("nome")      String nome
    );

    @Query("""
        SELECT r FROM Refeicao r
        WHERE r.cliente.id = :clienteId
          AND r.ativo = true
        ORDER BY r.nome
        """)
    List<Refeicao> findAtivas(@Param("clienteId") Long clienteId);

    Optional<Refeicao> findByIdAndClienteId(Long id, Long clienteId);
}
