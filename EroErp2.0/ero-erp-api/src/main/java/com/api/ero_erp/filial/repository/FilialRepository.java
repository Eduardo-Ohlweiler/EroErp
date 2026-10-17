package com.api.ero_erp.filial.repository;

import com.api.ero_erp.filial.entity.Filial;
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
public interface FilialRepository extends JpaRepository<Filial, UUID> {

    // ─── Escopo do tenant — nunca findById solto ────────────────────────
    @Query("""
            SELECT f FROM Filial f
            JOIN FETCH f.pessoa
            LEFT JOIN FETCH f.matriz m
            LEFT JOIN FETCH m.pessoa
            WHERE f.id = :id AND f.tenant.id = :tenantId
            """)
    Optional<Filial> findByIdAndTenantId(@Param("id") UUID id, @Param("tenantId") UUID tenantId);

    /**
     * As linhas de uma página ou de um combo, com pessoa e matriz já
     * carregadas. A ordem é a dos ids — quem a decide é a native que os buscou.
     */
    @Query("""
            SELECT f FROM Filial f
            JOIN FETCH f.pessoa
            LEFT JOIN FETCH f.matriz m
            LEFT JOIN FETCH m.pessoa
            WHERE f.id IN :ids AND f.tenant.id = :tenantId
            """)
    List<Filial> findAllComPessoa(@Param("ids") Collection<UUID> ids, @Param("tenantId") UUID tenantId);

    boolean existsByTenantIdAndPessoaId(UUID tenantId, UUID pessoaId);

    boolean existsByTenantIdAndPessoaIdAndIdNot(UUID tenantId, UUID pessoaId, UUID id);

    boolean existsByMatrizId(UUID matrizId);

    long countByMatrizIdAndAtivoTrue(UUID matrizId);

    /**
     * Listagem com filtros opcionais — só os ids, na ordem da tela.
     *
     * <p>Native com {@code CAST} explícito — regra 2 do CLAUDE.md. Devolver a
     * entidade daqui faria uma ida ao banco por linha para a pessoa e outra
     * para a matriz; com os ids, {@link #findAllComPessoa} traz tudo de uma vez.
     *
     * <p>A ordem agrupa cada matriz com as suas filiais: pelo nome da matriz
     * (o próprio, na matriz), a matriz primeiro e as filiais em seguida.
     */
    @Query(value = """
            SELECT f.id FROM filial f
            JOIN pessoa p ON p.id = f.pessoa_id
            LEFT JOIN filial m ON m.id = f.matriz_id
            LEFT JOIN pessoa mp ON mp.id = m.pessoa_id
            WHERE f.tenant_id = CAST(:tenantId AS uuid)
              AND (CAST(:nome AS text) IS NULL
                   OR unaccent(lower(p.nome)) LIKE unaccent(lower('%' || CAST(:nome AS text) || '%'))
                   OR unaccent(lower(coalesce(p.nome_fantasia, ''))) LIKE unaccent(lower('%' || CAST(:nome AS text) || '%')))
              AND (CAST(:documento AS text) IS NULL
                   OR coalesce(p.cpf, '') LIKE '%' || CAST(:documento AS text) || '%'
                   OR coalesce(p.cnpj, '') LIKE '%' || CAST(:documento AS text) || '%')
              AND (CAST(:tipo AS text) IS NULL OR f.tipo = CAST(:tipo AS text))
              AND (CAST(:ativo AS boolean) IS NULL OR f.ativo = CAST(:ativo AS boolean))
            ORDER BY coalesce(mp.nome, p.nome), coalesce(f.matriz_id, f.id), (f.tipo = 'FILIAL'), p.nome
            """,
            countQuery = """
            SELECT count(*) FROM filial f
            JOIN pessoa p ON p.id = f.pessoa_id
            WHERE f.tenant_id = CAST(:tenantId AS uuid)
              AND (CAST(:nome AS text) IS NULL
                   OR unaccent(lower(p.nome)) LIKE unaccent(lower('%' || CAST(:nome AS text) || '%'))
                   OR unaccent(lower(coalesce(p.nome_fantasia, ''))) LIKE unaccent(lower('%' || CAST(:nome AS text) || '%')))
              AND (CAST(:documento AS text) IS NULL
                   OR coalesce(p.cpf, '') LIKE '%' || CAST(:documento AS text) || '%'
                   OR coalesce(p.cnpj, '') LIKE '%' || CAST(:documento AS text) || '%')
              AND (CAST(:tipo AS text) IS NULL OR f.tipo = CAST(:tipo AS text))
              AND (CAST(:ativo AS boolean) IS NULL OR f.ativo = CAST(:ativo AS boolean))
            """,
            nativeQuery = true)
    Page<UUID> findIdsWithFilters(Pageable pageable,
                                  @Param("tenantId") UUID tenantId,
                                  @Param("nome") String nome,
                                  @Param("documento") String documento,
                                  @Param("tipo") String tipo,
                                  @Param("ativo") Boolean ativo);

    /** Combo: só ativas. {@code ignorarId} tira a própria filial do combo de matriz. */
    @Query(value = """
            SELECT f.id FROM filial f
            JOIN pessoa p ON p.id = f.pessoa_id
            WHERE f.tenant_id = CAST(:tenantId AS uuid)
              AND f.ativo = true
              AND (CAST(:termo AS text) IS NULL
                   OR unaccent(lower(p.nome)) LIKE unaccent(lower('%' || CAST(:termo AS text) || '%'))
                   OR unaccent(lower(coalesce(p.nome_fantasia, ''))) LIKE unaccent(lower('%' || CAST(:termo AS text) || '%'))
                   OR coalesce(p.cpf, '') LIKE '%' || CAST(:termo AS text) || '%'
                   OR coalesce(p.cnpj, '') LIKE '%' || CAST(:termo AS text) || '%')
              AND (CAST(:tipo AS text) IS NULL OR f.tipo = CAST(:tipo AS text))
              AND (CAST(:ignorarId AS uuid) IS NULL OR f.id <> CAST(:ignorarId AS uuid))
            ORDER BY p.nome
            LIMIT 100
            """, nativeQuery = true)
    List<UUID> findIdsForSelect(@Param("tenantId") UUID tenantId,
                                @Param("termo") String termo,
                                @Param("tipo") String tipo,
                                @Param("ignorarId") UUID ignorarId);
}
