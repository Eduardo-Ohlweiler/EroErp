package com.api.ero_erp.estoque.repository;

import com.api.ero_erp.estoque.entity.Estoque;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Toda consulta leva o tenant — no antigo a busca por (emitente, produto)
 * não levava, e o saldo e o preço de outro cliente vazavam.
 */
@Repository
public interface EstoqueRepository extends JpaRepository<Estoque, UUID> {

    // ─── Escopo do tenant — nunca findById solto ────────────────────────
    @Query("""
            SELECT e FROM Estoque e
            JOIN FETCH e.produto p
            JOIN FETCH p.unidadeMedida
            JOIN FETCH e.filial f
            JOIN FETCH f.pessoa
            WHERE e.id = :id AND e.tenant.id = :tenantId
            """)
    Optional<Estoque> findByIdAndTenantId(@Param("id") UUID id, @Param("tenantId") UUID tenantId);

    /**
     * A linha travada até o fim da transação ({@code SELECT … FOR UPDATE}),
     * para movimentar. Sem join: só a linha do estoque fica presa — travar o
     * produto e a filial juntos serializaria todo o movimento da filial.
     *
     * <p>Chamar antes de a linha estar no contexto de persistência: se já
     * estiver, o Hibernate devolve a instância de lá sem reler o saldo (o
     * {@code @Version} ainda recusaria a gravação, mas com 409 em vez de
     * esperar a vez).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM Estoque e WHERE e.id = :id AND e.tenant.id = :tenantId")
    Optional<Estoque> travar(@Param("id") UUID id, @Param("tenantId") UUID tenantId);

    /** Só o id: para achar a linha sem carregá-la antes da trava. */
    @Query("""
            SELECT e.id FROM Estoque e
            WHERE e.produto.id = :produtoId AND e.filial.id = :filialId AND e.tenant.id = :tenantId
            """)
    Optional<UUID> findIdByProdutoAndFilial(@Param("produtoId") UUID produtoId,
                                            @Param("filialId") UUID filialId,
                                            @Param("tenantId") UUID tenantId);

    /** As linhas de uma página ou de um combo, com produto e filial. A ordem é a da native. */
    @Query("""
            SELECT e FROM Estoque e
            JOIN FETCH e.produto p
            JOIN FETCH p.unidadeMedida
            JOIN FETCH e.filial f
            JOIN FETCH f.pessoa
            WHERE e.id IN :ids AND e.tenant.id = :tenantId
            """)
    List<Estoque> findAllCompletos(@Param("ids") Collection<UUID> ids, @Param("tenantId") UUID tenantId);

    /**
     * Listagem com filtros opcionais — só os ids, em ordem de produto e filial.
     *
     * <p>O termo procura no nome do produto; quando é número, também no
     * código e no EAN exatos.
     */
    @Query(value = """
            SELECT e.id FROM estoque e
            JOIN produto pr ON pr.id = e.produto_id
            JOIN filial f ON f.id = e.filial_id
            JOIN pessoa pe ON pe.id = f.pessoa_id
            WHERE e.tenant_id = CAST(:tenantId AS uuid)
              AND (CAST(:termo AS text) IS NULL
                   OR unaccent(lower(pr.nome)) LIKE unaccent(lower('%' || CAST(:termo AS text) || '%'))
                   OR pr.codigo = CAST(:codigo AS bigint)
                   OR pr.ean = CAST(:termo AS text))
              AND (CAST(:filialId AS uuid) IS NULL OR e.filial_id = CAST(:filialId AS uuid))
              AND (CAST(:produtoId AS uuid) IS NULL OR e.produto_id = CAST(:produtoId AS uuid))
              AND (CAST(:controla AS boolean) IS NULL OR e.controla_estoque = CAST(:controla AS boolean))
              AND (CAST(:ativo AS boolean) IS NULL OR e.ativo = CAST(:ativo AS boolean))
            ORDER BY pr.nome, pr.codigo, pe.nome
            """,
            countQuery = """
            SELECT count(*) FROM estoque e
            JOIN produto pr ON pr.id = e.produto_id
            WHERE e.tenant_id = CAST(:tenantId AS uuid)
              AND (CAST(:termo AS text) IS NULL
                   OR unaccent(lower(pr.nome)) LIKE unaccent(lower('%' || CAST(:termo AS text) || '%'))
                   OR pr.codigo = CAST(:codigo AS bigint)
                   OR pr.ean = CAST(:termo AS text))
              AND (CAST(:filialId AS uuid) IS NULL OR e.filial_id = CAST(:filialId AS uuid))
              AND (CAST(:produtoId AS uuid) IS NULL OR e.produto_id = CAST(:produtoId AS uuid))
              AND (CAST(:controla AS boolean) IS NULL OR e.controla_estoque = CAST(:controla AS boolean))
              AND (CAST(:ativo AS boolean) IS NULL OR e.ativo = CAST(:ativo AS boolean))
            """,
            nativeQuery = true)
    Page<UUID> findIdsWithFilters(Pageable pageable,
                                  @Param("tenantId") UUID tenantId,
                                  @Param("termo") String termo,
                                  @Param("codigo") Long codigo,
                                  @Param("filialId") UUID filialId,
                                  @Param("produtoId") UUID produtoId,
                                  @Param("controla") Boolean controla,
                                  @Param("ativo") Boolean ativo);

    /**
     * O que se movimenta numa filial: linha ativa, com controle de estoque,
     * de produto ativo. Sem controle, o produto não aparece aqui — é a regra.
     */
    @Query(value = """
            SELECT e.id FROM estoque e
            JOIN produto pr ON pr.id = e.produto_id
            WHERE e.tenant_id = CAST(:tenantId AS uuid)
              AND e.filial_id = CAST(:filialId AS uuid)
              AND e.ativo = true AND e.controla_estoque = true AND pr.ativo = true
              AND (CAST(:termo AS text) IS NULL
                   OR unaccent(lower(pr.nome)) LIKE unaccent(lower('%' || CAST(:termo AS text) || '%'))
                   OR pr.codigo = CAST(:codigo AS bigint)
                   OR pr.ean = CAST(:termo AS text))
            ORDER BY pr.nome, pr.codigo
            LIMIT 100
            """, nativeQuery = true)
    List<UUID> findIdsMovimentaveis(@Param("tenantId") UUID tenantId,
                                    @Param("filialId") UUID filialId,
                                    @Param("termo") String termo,
                                    @Param("codigo") Long codigo);
}
