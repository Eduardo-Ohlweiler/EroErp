package com.api.ero_erp.produto.repository;

import com.api.ero_erp.produto.entity.Produto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProdutoRepository extends JpaRepository<Produto, UUID> {

    // ─── Escopo do tenant — nunca findById solto ────────────────────────
    @Query("""
            SELECT p FROM Produto p
            JOIN FETCH p.unidadeMedida
            LEFT JOIN FETCH p.subgrupo s
            LEFT JOIN FETCH s.grupo
            LEFT JOIN FETCH p.categoria
            LEFT JOIN FETCH p.marca
            LEFT JOIN FETCH p.fornecedor
            WHERE p.id = :id AND p.tenant.id = :tenantId
            """)
    Optional<Produto> findByIdAndTenantId(@Param("id") UUID id, @Param("tenantId") UUID tenantId);

    /**
     * As linhas de uma página ou de um combo, com tudo o que o mapper toca.
     * A ordem é a dos ids — quem a decide é a native que os buscou.
     */
    @Query("""
            SELECT p FROM Produto p
            JOIN FETCH p.unidadeMedida
            LEFT JOIN FETCH p.subgrupo s
            LEFT JOIN FETCH s.grupo
            LEFT JOIN FETCH p.categoria
            LEFT JOIN FETCH p.marca
            LEFT JOIN FETCH p.fornecedor
            WHERE p.id IN :ids AND p.tenant.id = :tenantId
            """)
    List<Produto> findAllCompletos(@Param("ids") Collection<UUID> ids, @Param("tenantId") UUID tenantId);

    /** Nome já usado no tenant, sem diferenciar maiúscula nem acento. */
    @Query(value = """
            SELECT EXISTS (
                SELECT 1 FROM produto p
                WHERE p.tenant_id = CAST(:tenantId AS uuid)
                  AND unaccent(lower(p.nome)) = unaccent(lower(CAST(:nome AS text)))
                  AND (CAST(:ignorarId AS uuid) IS NULL OR p.id <> CAST(:ignorarId AS uuid)))
            """, nativeQuery = true)
    boolean existeNome(@Param("tenantId") UUID tenantId,
                       @Param("nome") String nome,
                       @Param("ignorarId") UUID ignorarId);

    /** O código do produto que já usa este EAN no tenant, se houver. */
    @Query(value = """
            SELECT p.codigo FROM produto p
            WHERE p.tenant_id = CAST(:tenantId AS uuid)
              AND p.ean = CAST(:ean AS text)
              AND (CAST(:ignorarId AS uuid) IS NULL OR p.id <> CAST(:ignorarId AS uuid))
            LIMIT 1
            """, nativeQuery = true)
    Optional<Long> codigoComEan(@Param("tenantId") UUID tenantId,
                                @Param("ean") String ean,
                                @Param("ignorarId") UUID ignorarId);

    /**
     * Listagem com filtros opcionais — só os ids, na ordem da tela.
     *
     * <p>O termo procura no nome; quando é número, também no código e no EAN
     * exatos. {@code grupoId} pega os produtos de qualquer subgrupo do grupo.
     */
    @Query(value = """
            SELECT p.id FROM produto p
            LEFT JOIN subgrupo_produto s ON s.id = p.subgrupo_id
            WHERE p.tenant_id = CAST(:tenantId AS uuid)
              AND (CAST(:termo AS text) IS NULL
                   OR unaccent(lower(p.nome)) LIKE unaccent(lower('%' || CAST(:termo AS text) || '%'))
                   OR p.codigo = CAST(:codigo AS bigint)
                   OR p.ean = CAST(:termo AS text))
              AND (CAST(:grupoId AS uuid) IS NULL OR s.grupo_id = CAST(:grupoId AS uuid))
              AND (CAST(:subgrupoId AS uuid) IS NULL OR p.subgrupo_id = CAST(:subgrupoId AS uuid))
              AND (CAST(:categoriaId AS uuid) IS NULL OR p.categoria_id = CAST(:categoriaId AS uuid))
              AND (CAST(:marcaId AS uuid) IS NULL OR p.marca_id = CAST(:marcaId AS uuid))
              AND (CAST(:ativo AS boolean) IS NULL OR p.ativo = CAST(:ativo AS boolean))
            ORDER BY p.nome, p.codigo
            """,
            countQuery = """
            SELECT count(*) FROM produto p
            LEFT JOIN subgrupo_produto s ON s.id = p.subgrupo_id
            WHERE p.tenant_id = CAST(:tenantId AS uuid)
              AND (CAST(:termo AS text) IS NULL
                   OR unaccent(lower(p.nome)) LIKE unaccent(lower('%' || CAST(:termo AS text) || '%'))
                   OR p.codigo = CAST(:codigo AS bigint)
                   OR p.ean = CAST(:termo AS text))
              AND (CAST(:grupoId AS uuid) IS NULL OR s.grupo_id = CAST(:grupoId AS uuid))
              AND (CAST(:subgrupoId AS uuid) IS NULL OR p.subgrupo_id = CAST(:subgrupoId AS uuid))
              AND (CAST(:categoriaId AS uuid) IS NULL OR p.categoria_id = CAST(:categoriaId AS uuid))
              AND (CAST(:marcaId AS uuid) IS NULL OR p.marca_id = CAST(:marcaId AS uuid))
              AND (CAST(:ativo AS boolean) IS NULL OR p.ativo = CAST(:ativo AS boolean))
            """,
            nativeQuery = true)
    Page<UUID> findIdsWithFilters(Pageable pageable,
                                  @Param("tenantId") UUID tenantId,
                                  @Param("termo") String termo,
                                  @Param("codigo") Long codigo,
                                  @Param("grupoId") UUID grupoId,
                                  @Param("subgrupoId") UUID subgrupoId,
                                  @Param("categoriaId") UUID categoriaId,
                                  @Param("marcaId") UUID marcaId,
                                  @Param("ativo") Boolean ativo);

    /** Combo: só ativos, por nome, código ou EAN. */
    @Query(value = """
            SELECT p.id FROM produto p
            WHERE p.tenant_id = CAST(:tenantId AS uuid)
              AND p.ativo = true
              AND (CAST(:termo AS text) IS NULL
                   OR unaccent(lower(p.nome)) LIKE unaccent(lower('%' || CAST(:termo AS text) || '%'))
                   OR p.codigo = CAST(:codigo AS bigint)
                   OR p.ean = CAST(:termo AS text))
            ORDER BY p.nome, p.codigo
            LIMIT 100
            """, nativeQuery = true)
    List<UUID> findIdsForSelect(@Param("tenantId") UUID tenantId,
                                @Param("termo") String termo,
                                @Param("codigo") Long codigo);
}
