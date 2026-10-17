package com.api.ero_erp.auxiliarproduto.repository;

import com.api.ero_erp.auxiliarproduto.entity.SubgrupoProduto;
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
public interface SubgrupoProdutoRepository extends JpaRepository<SubgrupoProduto, UUID> {

    // ─── Escopo do tenant — nunca findById solto ────────────────────────
    @Query("""
            SELECT s FROM SubgrupoProduto s
            JOIN FETCH s.grupo
            WHERE s.id = :id AND s.tenant.id = :tenantId
            """)
    Optional<SubgrupoProduto> findByIdAndTenantId(@Param("id") UUID id, @Param("tenantId") UUID tenantId);

    /** As linhas de uma página ou de um combo, com o grupo. A ordem é a da native. */
    @Query("""
            SELECT s FROM SubgrupoProduto s
            JOIN FETCH s.grupo
            WHERE s.id IN :ids AND s.tenant.id = :tenantId
            """)
    List<SubgrupoProduto> findAllComGrupo(@Param("ids") Collection<UUID> ids, @Param("tenantId") UUID tenantId);

    /** Nome já usado no grupo, sem diferenciar maiúscula nem acento. */
    @Query(value = """
            SELECT EXISTS (
                SELECT 1 FROM subgrupo_produto s
                WHERE s.grupo_id = CAST(:grupoId AS uuid)
                  AND unaccent(lower(s.nome)) = unaccent(lower(CAST(:nome AS text)))
                  AND (CAST(:ignorarId AS uuid) IS NULL OR s.id <> CAST(:ignorarId AS uuid)))
            """, nativeQuery = true)
    boolean existeNome(@Param("grupoId") UUID grupoId,
                       @Param("nome") String nome,
                       @Param("ignorarId") UUID ignorarId);

    /**
     * Listagem com filtros opcionais — só os ids, em ordem de grupo e nome.
     * O termo procura no nome do subgrupo e no do grupo.
     */
    @Query(value = """
            SELECT s.id FROM subgrupo_produto s
            JOIN grupo_produto g ON g.id = s.grupo_id
            WHERE s.tenant_id = CAST(:tenantId AS uuid)
              AND (CAST(:termo AS text) IS NULL
                   OR unaccent(lower(s.nome)) LIKE unaccent(lower('%' || CAST(:termo AS text) || '%'))
                   OR unaccent(lower(g.nome)) LIKE unaccent(lower('%' || CAST(:termo AS text) || '%')))
              AND (CAST(:grupoId AS uuid) IS NULL OR s.grupo_id = CAST(:grupoId AS uuid))
              AND (CAST(:ativo AS boolean) IS NULL OR s.ativo = CAST(:ativo AS boolean))
            ORDER BY g.nome, s.nome, s.id
            """,
            countQuery = """
            SELECT count(*) FROM subgrupo_produto s
            JOIN grupo_produto g ON g.id = s.grupo_id
            WHERE s.tenant_id = CAST(:tenantId AS uuid)
              AND (CAST(:termo AS text) IS NULL
                   OR unaccent(lower(s.nome)) LIKE unaccent(lower('%' || CAST(:termo AS text) || '%'))
                   OR unaccent(lower(g.nome)) LIKE unaccent(lower('%' || CAST(:termo AS text) || '%')))
              AND (CAST(:grupoId AS uuid) IS NULL OR s.grupo_id = CAST(:grupoId AS uuid))
              AND (CAST(:ativo AS boolean) IS NULL OR s.ativo = CAST(:ativo AS boolean))
            """,
            nativeQuery = true)
    Page<UUID> findIdsWithFilters(Pageable pageable,
                                  @Param("tenantId") UUID tenantId,
                                  @Param("termo") String termo,
                                  @Param("grupoId") UUID grupoId,
                                  @Param("ativo") Boolean ativo);

    /** Combo: subgrupo ativo de grupo ativo. */
    @Query(value = """
            SELECT s.id FROM subgrupo_produto s
            JOIN grupo_produto g ON g.id = s.grupo_id
            WHERE s.tenant_id = CAST(:tenantId AS uuid)
              AND s.ativo = true AND g.ativo = true
              AND (CAST(:grupoId AS uuid) IS NULL OR s.grupo_id = CAST(:grupoId AS uuid))
              AND (CAST(:termo AS text) IS NULL
                   OR unaccent(lower(s.nome)) LIKE unaccent(lower('%' || CAST(:termo AS text) || '%'))
                   OR unaccent(lower(g.nome)) LIKE unaccent(lower('%' || CAST(:termo AS text) || '%')))
            ORDER BY g.nome, s.nome
            LIMIT 100
            """, nativeQuery = true)
    List<UUID> findIdsForSelect(@Param("tenantId") UUID tenantId,
                                @Param("termo") String termo,
                                @Param("grupoId") UUID grupoId);
}
