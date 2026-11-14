package com.api.ero_api.auditoria.repository;

import com.api.ero_api.auditoria.dtos.JanelaEventosDto;
import com.api.ero_api.auditoria.entity.EventoSeguranca;
import com.api.ero_api.auditoria.enums.TipoEventoSeguranca;
import java.time.Instant;
import java.util.Collection;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Trilha de segurança. {@code tipos} nunca vem vazio e {@code de}/{@code ate} nunca
 * vêm nulos: o ConsultaEventoService preenche o padrão antes de chamar.
 */
public interface EventoSegurancaRepository extends JpaRepository<EventoSeguranca, UUID> {

    /**
     * Eventos de um contratante. EventoSeguranca não é TenantEntity: o filtro de
     * tenant aqui é MANUAL e obrigatório (consulta separada para usar o índice
     * tenant_id + created_at).
     */
    @Query("""
            SELECT e FROM EventoSeguranca e
            WHERE e.tenantId = :tenantId
              AND e.tipo IN :tipos
              AND (:usuarioId IS NULL OR e.usuarioId = :usuarioId)
              AND e.createdAt >= :de AND e.createdAt < :ate
            """)
    Page<EventoSeguranca> buscarDoTenant(@Param("tenantId") UUID tenantId,
                                         @Param("tipos") Collection<TipoEventoSeguranca> tipos,
                                         @Param("usuarioId") UUID usuarioId,
                                         @Param("de") Instant de,
                                         @Param("ate") Instant ate,
                                         Pageable pageable);

    /** Todos os contratantes (ou um, se informado): só para o superadmin na visão de plataforma. */
    @Query("""
            SELECT e FROM EventoSeguranca e
            WHERE (:tenantId IS NULL OR e.tenantId = :tenantId)
              AND e.tipo IN :tipos
              AND (:usuarioId IS NULL OR e.usuarioId = :usuarioId)
              AND e.createdAt >= :de AND e.createdAt < :ate
            """)
    Page<EventoSeguranca> buscarDeTodos(@Param("tenantId") UUID tenantId,
                                        @Param("tipos") Collection<TipoEventoSeguranca> tipos,
                                        @Param("usuarioId") UUID usuarioId,
                                        @Param("de") Instant de,
                                        @Param("ate") Instant ate,
                                        Pageable pageable);

    /**
     * Quantos eventos do tipo o usuário teve desde {@code desde} e quando foi o mais
     * antigo deles (limite de códigos por hora). Usa o índice ix_evento_seguranca_usuario
     * (só usuario_id): poucas linhas por usuário dentro da retenção.
     */
    @Query("""
            SELECT new com.api.ero_api.auditoria.dtos.JanelaEventosDto(COUNT(e), MIN(e.createdAt))
            FROM EventoSeguranca e
            WHERE e.usuarioId = :usuarioId
              AND e.tipo = :tipo
              AND e.createdAt >= :desde
            """)
    JanelaEventosDto resumirDoUsuarioDesde(@Param("usuarioId") UUID usuarioId,
                                           @Param("tipo") TipoEventoSeguranca tipo,
                                           @Param("desde") Instant desde);

    /**
     * Desfaz a reserva de um código cujo e-mail não saiu (CodigoVerificacaoService):
     * a única exclusão pontual da trilha, sempre do evento que acabou de ser gravado.
     * O DELETE passa por fora do contexto de persistência: grava o pendente antes e
     * limpa o contexto depois, para ninguém ler da memória um evento que já não existe.
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            DELETE FROM EventoSeguranca e
            WHERE e.id = :id AND e.tipo = :tipo
            """)
    int apagarPorIdETipo(@Param("id") UUID id, @Param("tipo") TipoEventoSeguranca tipo);

    /** Retenção: apaga o que passou do prazo (RetencaoEventoService). */
    @Modifying
    @Query("""
            DELETE FROM EventoSeguranca e
            WHERE e.createdAt < :limite
            """)
    int apagarAnterioresA(@Param("limite") Instant limite);
}
