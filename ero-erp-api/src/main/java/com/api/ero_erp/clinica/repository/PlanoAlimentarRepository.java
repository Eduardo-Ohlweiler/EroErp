package com.api.ero_erp.clinica.repository;

import com.api.ero_erp.clinica.entity.PlanoAlimentar;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PlanoAlimentarRepository extends JpaRepository<PlanoAlimentar, Long> {

    @Query("""
        SELECT p FROM PlanoAlimentar p
        LEFT JOIN FETCH p.itens
        WHERE p.id = :id
          AND p.cliente.id = :clienteId
        """)
    Optional<PlanoAlimentar> findByIdWithItens(
            @Param("id")        Long id,
            @Param("clienteId") Long clienteId
    );

    @Query("""
        SELECT p FROM PlanoAlimentar p
        WHERE p.cliente.id = :clienteId
          AND (:nome IS NULL OR LOWER(p.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
          AND (:pessoaId IS NULL OR p.pessoa.id = :pessoaId)
        """)
    Page<PlanoAlimentar> findAllWithFilters(
            Pageable pageable,
            @Param("clienteId") Long   clienteId,
            @Param("nome")      String nome,
            @Param("pessoaId")  Long   pessoaId
    );
}
