package com.api.ero_erp.tipocadastro.repository;

import com.api.ero_erp.tipocadastro.entity.TipoCadastro;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TipoCadastroRepository extends JpaRepository<TipoCadastro, Long> {

    boolean existsByNomeIgnoreCase(String nome);

    Optional<TipoCadastro> findByNomeIgnoreCase(String nome);

    @Query("""
        SELECT t FROM TipoCadastro t
        WHERE (:nome IS NULL OR LOWER(t.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
    """)
    Page<TipoCadastro> findAllWithFilters(Pageable pageable, @Param("nome") String nome);

    @Query("SELECT t FROM TipoCadastro t " +
            "WHERE t.ativo = true " +
            "ORDER BY t.nome")
    List<TipoCadastro> findForSelect();
}
