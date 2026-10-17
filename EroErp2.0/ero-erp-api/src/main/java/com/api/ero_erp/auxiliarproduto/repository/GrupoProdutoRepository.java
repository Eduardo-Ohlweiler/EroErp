package com.api.ero_erp.auxiliarproduto.repository;

import com.api.ero_erp.auxiliarproduto.entity.GrupoProduto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/** Native com {@code CAST} explícito — regra 2 do CLAUDE.md. */
@Repository
public interface GrupoProdutoRepository extends AuxiliarSimplesRepository<GrupoProduto> {

    @Override
    @Query(value = """
            SELECT EXISTS (
                SELECT 1 FROM grupo_produto a
                WHERE a.tenant_id = CAST(:tenantId AS uuid)
                  AND unaccent(lower(a.nome)) = unaccent(lower(CAST(:nome AS text)))
                  AND (CAST(:ignorarId AS uuid) IS NULL OR a.id <> CAST(:ignorarId AS uuid)))
            """, nativeQuery = true)
    boolean existeNome(@Param("tenantId") UUID tenantId,
                       @Param("nome") String nome,
                       @Param("ignorarId") UUID ignorarId);

    @Override
    @Query(value = """
            SELECT a.* FROM grupo_produto a
            WHERE a.tenant_id = CAST(:tenantId AS uuid)
              AND (CAST(:termo AS text) IS NULL
                   OR unaccent(lower(a.nome)) LIKE unaccent(lower('%' || CAST(:termo AS text) || '%')))
              AND (CAST(:ativo AS boolean) IS NULL OR a.ativo = CAST(:ativo AS boolean))
            ORDER BY a.nome, a.id
            """,
            countQuery = """
            SELECT count(*) FROM grupo_produto a
            WHERE a.tenant_id = CAST(:tenantId AS uuid)
              AND (CAST(:termo AS text) IS NULL
                   OR unaccent(lower(a.nome)) LIKE unaccent(lower('%' || CAST(:termo AS text) || '%')))
              AND (CAST(:ativo AS boolean) IS NULL OR a.ativo = CAST(:ativo AS boolean))
            """,
            nativeQuery = true)
    Page<GrupoProduto> findWithFilters(Pageable pageable,
                                       @Param("tenantId") UUID tenantId,
                                       @Param("termo") String termo,
                                       @Param("ativo") Boolean ativo);

    @Override
    @Query(value = """
            SELECT a.* FROM grupo_produto a
            WHERE a.tenant_id = CAST(:tenantId AS uuid)
              AND a.ativo = true
              AND (CAST(:termo AS text) IS NULL
                   OR unaccent(lower(a.nome)) LIKE unaccent(lower('%' || CAST(:termo AS text) || '%')))
            ORDER BY a.nome
            LIMIT 100
            """, nativeQuery = true)
    List<GrupoProduto> findForSelect(@Param("tenantId") UUID tenantId, @Param("termo") String termo);
}
