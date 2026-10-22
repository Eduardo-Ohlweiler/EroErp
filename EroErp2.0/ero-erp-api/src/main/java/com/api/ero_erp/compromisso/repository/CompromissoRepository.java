package com.api.ero_erp.compromisso.repository;

import com.api.ero_erp.compromisso.entity.Compromisso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CompromissoRepository extends JpaRepository<Compromisso, UUID> {

    // ─── Escopo do tenant — nunca findById solto ────────────────────────
    @Query("""
            SELECT DISTINCT c FROM Compromisso c
            JOIN FETCH c.filial f
            JOIN FETCH f.pessoa
            JOIN FETCH c.responsavel
            LEFT JOIN FETCH c.pessoa
            LEFT JOIN FETCH c.convidados cv
            LEFT JOIN FETCH cv.usuario
            WHERE c.id = :id AND c.tenant.id = :tenantId
            """)
    Optional<Compromisso> findByIdAndTenantId(@Param("id") UUID id, @Param("tenantId") UUID tenantId);

    /**
     * Os compromissos de uma janela do calendário ou de uma checagem de
     * conflito, já com o que a tela mostra. A ordem é a dos ids — quem a
     * decide é a native que os buscou.
     */
    @Query("""
            SELECT DISTINCT c FROM Compromisso c
            JOIN FETCH c.filial f
            JOIN FETCH f.pessoa
            JOIN FETCH c.responsavel
            LEFT JOIN FETCH c.pessoa
            LEFT JOIN FETCH c.convidados cv
            LEFT JOIN FETCH cv.usuario
            WHERE c.id IN :ids AND c.tenant.id = :tenantId
            """)
    List<Compromisso> findAllCompletos(@Param("ids") Collection<UUID> ids, @Param("tenantId") UUID tenantId);

    /**
     * A janela do calendário. {@code usuarioId} casa o responsável <b>ou</b> um
     * convidado: "a agenda do Fulano" inclui o que ele foi chamado a participar.
     *
     * <p>Native com {@code CAST} explícito — regra 2 do CLAUDE.md.
     */
    @Query(value = """
            SELECT c.id FROM compromisso c
            WHERE c.tenant_id = CAST(:tenantId AS uuid)
              AND c.inicio < CAST(:fim AS timestamptz)
              AND c.fim > CAST(:inicio AS timestamptz)
              AND (CAST(:filialId AS uuid) IS NULL OR c.filial_id = CAST(:filialId AS uuid))
              AND (CAST(:usuarioId AS uuid) IS NULL
                   OR c.responsavel_id = CAST(:usuarioId AS uuid)
                   OR EXISTS (SELECT 1 FROM compromisso_convidado cc
                              WHERE cc.compromisso_id = c.id
                                AND cc.usuario_id = CAST(:usuarioId AS uuid)))
            ORDER BY c.inicio, c.fim, c.id
            LIMIT 2000
            """, nativeQuery = true)
    List<UUID> findIdsDoCalendario(@Param("tenantId") UUID tenantId,
                                   @Param("inicio") Instant inicio,
                                   @Param("fim") Instant fim,
                                   @Param("filialId") UUID filialId,
                                   @Param("usuarioId") UUID usuarioId);

    /**
     * Quem dos {@code usuarioIds} já está ocupado no intervalo, como
     * responsável ou convidado, e em qual compromisso. Cada linha é
     * {@code [usuario_id, compromisso_id]}.
     *
     * <p>Cancelado e falta não ocupam o horário. As duas metades do UNION usam
     * cada uma o seu índice (responsável × convidado), o que um OR não faria.
     */
    @Query(value = """
            SELECT c.responsavel_id, c.id, c.inicio FROM compromisso c
            WHERE c.tenant_id = CAST(:tenantId AS uuid)
              AND c.responsavel_id IN (:usuarioIds)
              AND c.status NOT IN ('CANCELADO', 'FALTOU')
              AND c.inicio < CAST(:fim AS timestamptz)
              AND c.fim > CAST(:inicio AS timestamptz)
              AND (CAST(:ignorarId AS uuid) IS NULL OR c.id <> CAST(:ignorarId AS uuid))
            UNION ALL
            SELECT cc.usuario_id, c.id, c.inicio FROM compromisso c
            JOIN compromisso_convidado cc ON cc.compromisso_id = c.id
            WHERE c.tenant_id = CAST(:tenantId AS uuid)
              AND cc.usuario_id IN (:usuarioIds)
              AND c.status NOT IN ('CANCELADO', 'FALTOU')
              AND c.inicio < CAST(:fim AS timestamptz)
              AND c.fim > CAST(:inicio AS timestamptz)
              AND (CAST(:ignorarId AS uuid) IS NULL OR c.id <> CAST(:ignorarId AS uuid))
            ORDER BY 3
            """, nativeQuery = true)
    List<Object[]> findOcupacoes(@Param("tenantId") UUID tenantId,
                                 @Param("usuarioIds") Collection<UUID> usuarioIds,
                                 @Param("inicio") Instant inicio,
                                 @Param("fim") Instant fim,
                                 @Param("ignorarId") UUID ignorarId);

    /** O próprio e os seguintes da série que ainda estão abertos — o "cancelar estes". */
    @Query("""
            SELECT c FROM Compromisso c
            WHERE c.tenant.id = :tenantId
              AND c.serieId = :serieId
              AND c.inicio >= :aPartirDe
              AND c.status IN (com.api.ero_erp.compromisso.enums.StatusCompromisso.AGENDADO,
                               com.api.ero_erp.compromisso.enums.StatusCompromisso.CONFIRMADO,
                               com.api.ero_erp.compromisso.enums.StatusCompromisso.EM_ATENDIMENTO)
            ORDER BY c.inicio
            """)
    List<Compromisso> findAbertosDaSerieAPartirDe(@Param("tenantId") UUID tenantId,
                                                   @Param("serieId") UUID serieId,
                                                   @Param("aPartirDe") Instant aPartirDe);
}
