package com.api.ero_erp.estoque.repository;

import com.api.ero_erp.estoque.entity.EstoqueMovimentacao;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface EstoqueMovimentacaoRepository extends JpaRepository<EstoqueMovimentacao, UUID> {

    /** As linhas de uma página, com tudo o que o mapper toca. A ordem é a da native. */
    @Query("""
            SELECT m FROM EstoqueMovimentacao m
            JOIN FETCH m.estoque e
            JOIN FETCH e.produto p
            JOIN FETCH p.unidadeMedida
            JOIN FETCH e.filial f
            JOIN FETCH f.pessoa
            LEFT JOIN FETCH m.filialContraparte c
            LEFT JOIN FETCH c.pessoa
            LEFT JOIN FETCH m.createdBy
            WHERE m.id IN :ids AND m.tenant.id = :tenantId
            """)
    List<EstoqueMovimentacao> findAllCompletos(@Param("ids") Collection<UUID> ids,
                                               @Param("tenantId") UUID tenantId);

    /**
     * O histórico, do mais novo para o mais antigo — só os ids. Native com
     * {@code CAST} (regra 2); {@code ate} é exclusivo.
     */
    @Query(value = """
            SELECT m.id FROM estoque_movimentacao m
            JOIN estoque e ON e.id = m.estoque_id
            WHERE m.tenant_id = CAST(:tenantId AS uuid)
              AND (CAST(:estoqueId AS uuid) IS NULL OR m.estoque_id = CAST(:estoqueId AS uuid))
              AND (CAST(:filialId AS uuid) IS NULL OR e.filial_id = CAST(:filialId AS uuid))
              AND (CAST(:produtoId AS uuid) IS NULL OR e.produto_id = CAST(:produtoId AS uuid))
              AND (CAST(:tipo AS text) IS NULL OR m.tipo = CAST(:tipo AS text))
              AND (CAST(:de AS timestamptz) IS NULL OR m.created_at >= CAST(:de AS timestamptz))
              AND (CAST(:ate AS timestamptz) IS NULL OR m.created_at < CAST(:ate AS timestamptz))
            ORDER BY m.created_at DESC, m.id
            """,
            countQuery = """
            SELECT count(*) FROM estoque_movimentacao m
            JOIN estoque e ON e.id = m.estoque_id
            WHERE m.tenant_id = CAST(:tenantId AS uuid)
              AND (CAST(:estoqueId AS uuid) IS NULL OR m.estoque_id = CAST(:estoqueId AS uuid))
              AND (CAST(:filialId AS uuid) IS NULL OR e.filial_id = CAST(:filialId AS uuid))
              AND (CAST(:produtoId AS uuid) IS NULL OR e.produto_id = CAST(:produtoId AS uuid))
              AND (CAST(:tipo AS text) IS NULL OR m.tipo = CAST(:tipo AS text))
              AND (CAST(:de AS timestamptz) IS NULL OR m.created_at >= CAST(:de AS timestamptz))
              AND (CAST(:ate AS timestamptz) IS NULL OR m.created_at < CAST(:ate AS timestamptz))
            """,
            nativeQuery = true)
    Page<UUID> findIdsWithFilters(Pageable pageable,
                                  @Param("tenantId") UUID tenantId,
                                  @Param("estoqueId") UUID estoqueId,
                                  @Param("filialId") UUID filialId,
                                  @Param("produtoId") UUID produtoId,
                                  @Param("tipo") String tipo,
                                  @Param("de") Instant de,
                                  @Param("ate") Instant ate);
}
