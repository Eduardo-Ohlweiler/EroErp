package com.api.ero_erp.clinica.repository;

import com.api.ero_erp.clinica.entity.FichaAnamnese;
import com.api.ero_erp.clinica.enums.TipoFinalidade;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FichaAnamneseRepository extends JpaRepository<FichaAnamnese, Long> {

    @Query("""
            SELECT f FROM FichaAnamnese f
            JOIN FETCH f.pessoa
            JOIN FETCH f.template
            WHERE f.id = :id
              AND f.cliente.id = :clienteId
            """)
    Optional<FichaAnamnese> findByIdAndClienteId(
            @Param("id")        Long id,
            @Param("clienteId") Long clienteId
    );

    @Query(value = """
            SELECT f FROM FichaAnamnese f
            JOIN f.pessoa p
            JOIN f.template t
            WHERE f.cliente.id = :clienteId
              AND (:pessoaId IS NULL OR f.pessoa.id = :pessoaId)
              AND (:finalidade IS NULL OR t.finalidade = :finalidade)
            ORDER BY f.dataPreenchimento DESC
            """,
           countQuery = """
            SELECT COUNT(f) FROM FichaAnamnese f
            JOIN f.template t
            WHERE f.cliente.id = :clienteId
              AND (:pessoaId IS NULL OR f.pessoa.id = :pessoaId)
              AND (:finalidade IS NULL OR t.finalidade = :finalidade)
            """)
    Page<FichaAnamnese> findAllWithFilters(
            Pageable pageable,
            @Param("clienteId")  Long clienteId,
            @Param("pessoaId")   Long pessoaId,
            @Param("finalidade") TipoFinalidade finalidade
    );

    @Query("""
            SELECT f FROM FichaAnamnese f
            JOIN FETCH f.template
            WHERE f.cliente.id = :clienteId
              AND f.pessoa.id = :pessoaId
            ORDER BY f.dataPreenchimento DESC
            """)
    List<FichaAnamnese> findByClienteIdAndPessoaId(
            @Param("clienteId") Long clienteId,
            @Param("pessoaId")  Long pessoaId
    );
}
