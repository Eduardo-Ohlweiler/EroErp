package com.api.ero_erp.tipoproduto.repository;

import com.api.ero_erp.tipoproduto.entity.TipoProduto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TipoProdutoRepository extends JpaRepository<TipoProduto, Long> {

    @Query("""
            SELECT t FROM TipoProduto t
            WHERE t.ativo = true
            AND (:nome IS NULL OR LOWER(t.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
            ORDER BY t.nome
            """)
    List<TipoProduto> findAtivos(@Param("nome") String nome);
}
