package com.api.ero_erp.clinica.repository;

import com.api.ero_erp.clinica.entity.TemplateAnamnese;
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
public interface TemplateAnamneseRepository extends JpaRepository<TemplateAnamnese, Long> {

    @Query("""
            SELECT t FROM TemplateAnamnese t
            WHERE t.ativo = true
              AND t.finalidade = :finalidade
              AND (t.cliente.id = :clienteId OR t.cliente IS NULL)
            ORDER BY t.cliente.id DESC NULLS LAST
            """)
    List<TemplateAnamnese> findAtivosByFinalidade(
            @Param("finalidade") TipoFinalidade finalidade,
            @Param("clienteId")  Long clienteId
    );

    @Query("""
            SELECT t FROM TemplateAnamnese t LEFT JOIN FETCH t.campos
            WHERE t.id = :id
              AND (t.cliente.id = :clienteId OR t.cliente IS NULL)
            """)
    Optional<TemplateAnamnese> findByIdWithCampos(
            @Param("id")        Long id,
            @Param("clienteId") Long clienteId
    );

    @Query(value = """
            SELECT t FROM TemplateAnamnese t
            WHERE (t.cliente.id = :clienteId OR t.cliente IS NULL)
              AND (:nome IS NULL OR LOWER(t.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
              AND (:finalidade IS NULL OR t.finalidade = :finalidade)
            ORDER BY t.nome ASC
            """,
           countQuery = """
            SELECT COUNT(t) FROM TemplateAnamnese t
            WHERE (t.cliente.id = :clienteId OR t.cliente IS NULL)
              AND (:nome IS NULL OR LOWER(t.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
              AND (:finalidade IS NULL OR t.finalidade = :finalidade)
            """)
    Page<TemplateAnamnese> findAllWithFilters(
            Pageable pageable,
            @Param("clienteId")  Long clienteId,
            @Param("nome")       String nome,
            @Param("finalidade") TipoFinalidade finalidade
    );
}
