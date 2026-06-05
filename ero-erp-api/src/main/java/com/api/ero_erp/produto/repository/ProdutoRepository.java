package com.api.ero_erp.produto.repository;

import com.api.ero_erp.produto.entity.Produto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProdutoRepository extends JpaRepository<Produto, Long> {

    @Query("""
            SELECT p FROM Produto p
            JOIN FETCH p.tipoProduto
            JOIN FETCH p.unidadeMedida
            LEFT JOIN FETCH p.subgrupo
            LEFT JOIN FETCH p.categoria
            LEFT JOIN FETCH p.marca
            LEFT JOIN FETCH p.ncm
            LEFT JOIN FETCH p.origemProduto
            LEFT JOIN FETCH p.fornecedorPessoa
            WHERE p.id = :id
            AND p.cliente.id = :clienteId
            """)
    Optional<Produto> findByIdAndClienteId(
            @Param("id")        Long id,
            @Param("clienteId") Long clienteId
    );

    @Query("""
            SELECT p FROM Produto p
            JOIN FETCH p.tipoProduto
            JOIN FETCH p.unidadeMedida
            LEFT JOIN FETCH p.subgrupo
            LEFT JOIN FETCH p.categoria
            LEFT JOIN FETCH p.marca
            WHERE p.cliente.id = :clienteId
            AND (:bloqueado IS NULL OR p.bloqueado = :bloqueado)
            AND (:tipoProdutoId IS NULL OR p.tipoProduto.id = :tipoProdutoId)
            AND (:subgrupoId IS NULL OR p.subgrupo.id = :subgrupoId)
            AND (:categoriaId IS NULL OR p.categoria.id = :categoriaId)
            AND (:marcaId IS NULL OR p.marca.id = :marcaId)
            AND (:nome IS NULL OR LOWER(p.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
            """)
    Page<Produto> findAllWithFilters(
            Pageable pageable,
            @Param("clienteId")     Long    clienteId,
            @Param("bloqueado")     Boolean bloqueado,
            @Param("tipoProdutoId") Long    tipoProdutoId,
            @Param("subgrupoId")    Long    subgrupoId,
            @Param("categoriaId")   Long    categoriaId,
            @Param("marcaId")       Long    marcaId,
            @Param("nome")          String  nome
    );

    @Query("""
            SELECT p FROM Produto p
            JOIN FETCH p.tipoProduto
            JOIN FETCH p.unidadeMedida
            WHERE p.cliente.id = :clienteId
            AND p.bloqueado = false
            AND (:tipoProdutoId IS NULL OR p.tipoProduto.id = :tipoProdutoId)
            AND (:classificacao IS NULL OR UPPER(p.tipoProduto.classificacao) = UPPER(:classificacao))
            AND (:nome IS NULL OR LOWER(p.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
            ORDER BY p.nome
            """)
    List<Produto> findForSelect(
            @Param("clienteId")     Long   clienteId,
            @Param("tipoProdutoId") Long   tipoProdutoId,
            @Param("classificacao") String classificacao,
            @Param("nome")          String nome
    );
}
