package com.api.ero_api.auditoria.repository;

import com.api.ero_api.auditoria.entity.EventoSeguranca;
import com.api.ero_api.auditoria.enums.TipoEventoSeguranca;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EventoSegurancaRepository extends JpaRepository<EventoSeguranca, UUID> {

    /**
     * Eventos de um contratante. EventoSeguranca não é TenantEntity: o filtro de
     * tenant aqui é MANUAL e obrigatório (consulta separada para usar o índice
     * tenant_id + created_at).
     */
    @Query("""
            SELECT e FROM EventoSeguranca e
            WHERE e.tenantId = :tenantId
              AND (:tipo IS NULL OR e.tipo = :tipo)
              AND (:usuarioId IS NULL OR e.usuarioId = :usuarioId)
            """)
    Page<EventoSeguranca> buscarDoTenant(@Param("tenantId") UUID tenantId,
                                         @Param("tipo") TipoEventoSeguranca tipo,
                                         @Param("usuarioId") UUID usuarioId,
                                         Pageable pageable);

    /** Todos os contratantes: só para o superadmin na visão de plataforma. */
    @Query("""
            SELECT e FROM EventoSeguranca e
            WHERE (:tipo IS NULL OR e.tipo = :tipo)
              AND (:usuarioId IS NULL OR e.usuarioId = :usuarioId)
            """)
    Page<EventoSeguranca> buscarDeTodos(@Param("tipo") TipoEventoSeguranca tipo,
                                        @Param("usuarioId") UUID usuarioId,
                                        Pageable pageable);
}
