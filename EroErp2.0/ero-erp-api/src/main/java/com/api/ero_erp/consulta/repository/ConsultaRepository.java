package com.api.ero_erp.consulta.repository;

import com.api.ero_erp.consulta.entity.Consulta;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConsultaRepository extends JpaRepository<Consulta, UUID> {

    // ─── Escopo do tenant — nunca findById solto ────────────────────────
    @Query("""
            SELECT cs FROM Consulta cs
            JOIN FETCH cs.compromisso c
            JOIN FETCH c.filial f
            JOIN FETCH f.pessoa
            JOIN FETCH c.responsavel
            LEFT JOIN FETCH c.pessoa
            WHERE cs.id = :id AND cs.tenant.id = :tenantId
            """)
    Optional<Consulta> findByIdAndTenantId(@Param("id") UUID id, @Param("tenantId") UUID tenantId);

    /**
     * A consulta travada até o fim da transação, sem join: concluir duas vezes
     * ao mesmo tempo baixaria o estoque duas vezes. A segunda espera, e lê o
     * compromisso já concluído. Chamar antes de carregar a consulta.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT cs FROM Consulta cs WHERE cs.id = :id AND cs.tenant.id = :tenantId")
    Optional<Consulta> travar(@Param("id") UUID id, @Param("tenantId") UUID tenantId);

    /** As linhas de uma página, com o compromisso. A ordem é a da native; os itens vêm em lote. */
    @Query("""
            SELECT cs FROM Consulta cs
            JOIN FETCH cs.compromisso c
            JOIN FETCH c.filial f
            JOIN FETCH f.pessoa
            JOIN FETCH c.responsavel
            LEFT JOIN FETCH c.pessoa
            WHERE cs.id IN :ids AND cs.tenant.id = :tenantId
            """)
    List<Consulta> findAllCompletas(@Param("ids") Collection<UUID> ids, @Param("tenantId") UUID tenantId);

    /**
     * Listagem com filtros opcionais sobre o compromisso — só os ids, do mais
     * recente para o mais antigo. {@code de} inclusivo, {@code ate} exclusivo.
     *
     * <p>Native com {@code CAST} explícito — regra 2 do CLAUDE.md.
     */
    @Query(value = """
            SELECT cs.id FROM consulta cs
            JOIN compromisso c ON c.id = cs.compromisso_id
            WHERE cs.tenant_id = CAST(:tenantId AS uuid)
              AND (CAST(:filialId AS uuid) IS NULL OR c.filial_id = CAST(:filialId AS uuid))
              AND (CAST(:responsavelId AS uuid) IS NULL OR c.responsavel_id = CAST(:responsavelId AS uuid))
              AND (CAST(:pessoaId AS uuid) IS NULL OR c.pessoa_id = CAST(:pessoaId AS uuid))
              AND (CAST(:status AS text) IS NULL OR c.status = CAST(:status AS text))
              AND (CAST(:de AS timestamptz) IS NULL OR c.inicio >= CAST(:de AS timestamptz))
              AND (CAST(:ate AS timestamptz) IS NULL OR c.inicio < CAST(:ate AS timestamptz))
            ORDER BY c.inicio DESC, cs.id
            """,
            countQuery = """
            SELECT count(*) FROM consulta cs
            JOIN compromisso c ON c.id = cs.compromisso_id
            WHERE cs.tenant_id = CAST(:tenantId AS uuid)
              AND (CAST(:filialId AS uuid) IS NULL OR c.filial_id = CAST(:filialId AS uuid))
              AND (CAST(:responsavelId AS uuid) IS NULL OR c.responsavel_id = CAST(:responsavelId AS uuid))
              AND (CAST(:pessoaId AS uuid) IS NULL OR c.pessoa_id = CAST(:pessoaId AS uuid))
              AND (CAST(:status AS text) IS NULL OR c.status = CAST(:status AS text))
              AND (CAST(:de AS timestamptz) IS NULL OR c.inicio >= CAST(:de AS timestamptz))
              AND (CAST(:ate AS timestamptz) IS NULL OR c.inicio < CAST(:ate AS timestamptz))
            """,
            nativeQuery = true)
    Page<UUID> findIdsWithFilters(Pageable pageable,
                                  @Param("tenantId") UUID tenantId,
                                  @Param("filialId") UUID filialId,
                                  @Param("responsavelId") UUID responsavelId,
                                  @Param("pessoaId") UUID pessoaId,
                                  @Param("status") String status,
                                  @Param("de") Instant de,
                                  @Param("ate") Instant ate);
}
