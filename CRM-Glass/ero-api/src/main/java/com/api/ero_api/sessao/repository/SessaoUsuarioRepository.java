package com.api.ero_api.sessao.repository;

import com.api.ero_api.sessao.entity.SessaoUsuario;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SessaoUsuarioRepository extends JpaRepository<SessaoUsuario, UUID> {

    @Query("""
            SELECT s FROM SessaoUsuario s
            WHERE s.id = :id
            """)
    Optional<SessaoUsuario> buscarPorId(@Param("id") UUID id);

    @Query("""
            SELECT s FROM SessaoUsuario s
            WHERE s.usuarioId = :usuarioId
              AND s.revogadaEm IS NULL
              AND s.expiraEm > :agora
            ORDER BY s.ultimoUsoEm DESC
            """)
    List<SessaoUsuario> buscarAtivasDoUsuario(@Param("usuarioId") UUID usuarioId, @Param("agora") Instant agora);

    /** Limpeza: sessão vencida não renova mais. Apague antes os refresh tokens dela (FK). */
    @Modifying
    @Query("""
            DELETE FROM SessaoUsuario s
            WHERE s.expiraEm < :agora
            """)
    int apagarExpiradas(@Param("agora") Instant agora);
}
