package com.api.ero_erp.servico.repository;

import com.api.ero_erp.servico.entity.Servico;
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
public interface ServicoRepository extends JpaRepository<Servico, UUID> {

    // ─── Escopo do tenant — nunca findById solto ────────────────────────
    @Query("""
            SELECT s FROM Servico s
            LEFT JOIN FETCH s.filiais sf
            LEFT JOIN FETCH sf.filial f
            LEFT JOIN FETCH f.pessoa
            WHERE s.id = :id AND s.tenant.id = :tenantId
            """)
    Optional<Servico> findByIdAndTenantId(@Param("id") UUID id, @Param("tenantId") UUID tenantId);

    /**
     * As linhas de uma página ou de um combo, com os valores por filial já
     * carregados. A ordem é a dos ids — quem a decide é a native que os buscou.
     */
    @Query("""
            SELECT s FROM Servico s
            LEFT JOIN FETCH s.filiais sf
            LEFT JOIN FETCH sf.filial f
            LEFT JOIN FETCH f.pessoa
            WHERE s.id IN :ids AND s.tenant.id = :tenantId
            """)
    List<Servico> findAllComFiliais(@Param("ids") Collection<UUID> ids, @Param("tenantId") UUID tenantId);

    /**
     * Nome já usado no tenant, sem diferenciar maiúscula nem acento.
     * {@code ignorarId} tira o próprio serviço na alteração.
     */
    @Query(value = """
            SELECT EXISTS (
                SELECT 1 FROM servico s
                WHERE s.tenant_id = CAST(:tenantId AS uuid)
                  AND unaccent(lower(s.nome)) = unaccent(lower(CAST(:nome AS text)))
                  AND (CAST(:ignorarId AS uuid) IS NULL OR s.id <> CAST(:ignorarId AS uuid)))
            """, nativeQuery = true)
    boolean existeNome(@Param("tenantId") UUID tenantId,
                       @Param("nome") String nome,
                       @Param("ignorarId") UUID ignorarId);

    /**
     * Listagem com filtros opcionais — só os ids, na ordem da tela.
     *
     * <p>Native com {@code CAST} explícito — regra 2 do CLAUDE.md. O termo
     * procura no nome; quando é número, também no código exato.
     * {@code filialId} traz os serviços que têm linha naquela filial, com
     * valor ou sem.
     */
    @Query(value = """
            SELECT s.id FROM servico s
            WHERE s.tenant_id = CAST(:tenantId AS uuid)
              AND (CAST(:termo AS text) IS NULL
                   OR unaccent(lower(s.nome)) LIKE unaccent(lower('%' || CAST(:termo AS text) || '%'))
                   OR s.codigo = CAST(:codigo AS bigint))
              AND (CAST(:filialId AS uuid) IS NULL OR EXISTS (
                   SELECT 1 FROM servico_filial sf
                   WHERE sf.servico_id = s.id AND sf.filial_id = CAST(:filialId AS uuid)))
              AND (CAST(:ativo AS boolean) IS NULL OR s.ativo = CAST(:ativo AS boolean))
            ORDER BY s.nome, s.codigo
            """,
            countQuery = """
            SELECT count(*) FROM servico s
            WHERE s.tenant_id = CAST(:tenantId AS uuid)
              AND (CAST(:termo AS text) IS NULL
                   OR unaccent(lower(s.nome)) LIKE unaccent(lower('%' || CAST(:termo AS text) || '%'))
                   OR s.codigo = CAST(:codigo AS bigint))
              AND (CAST(:filialId AS uuid) IS NULL OR EXISTS (
                   SELECT 1 FROM servico_filial sf
                   WHERE sf.servico_id = s.id AND sf.filial_id = CAST(:filialId AS uuid)))
              AND (CAST(:ativo AS boolean) IS NULL OR s.ativo = CAST(:ativo AS boolean))
            """,
            nativeQuery = true)
    Page<UUID> findIdsWithFilters(Pageable pageable,
                                  @Param("tenantId") UUID tenantId,
                                  @Param("termo") String termo,
                                  @Param("codigo") Long codigo,
                                  @Param("filialId") UUID filialId,
                                  @Param("ativo") Boolean ativo);

    /** Combo: só ativos, por nome ou código. */
    @Query(value = """
            SELECT s.id FROM servico s
            WHERE s.tenant_id = CAST(:tenantId AS uuid)
              AND s.ativo = true
              AND (CAST(:termo AS text) IS NULL
                   OR unaccent(lower(s.nome)) LIKE unaccent(lower('%' || CAST(:termo AS text) || '%'))
                   OR s.codigo = CAST(:codigo AS bigint))
            ORDER BY s.nome, s.codigo
            LIMIT 100
            """, nativeQuery = true)
    List<UUID> findIdsForSelect(@Param("tenantId") UUID tenantId,
                                @Param("termo") String termo,
                                @Param("codigo") Long codigo);
}
