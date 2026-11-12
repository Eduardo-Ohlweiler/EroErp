package com.api.ero_api.auth.repository;

import com.api.ero_api.auth.entity.CodigoVerificacao;
import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Usado só em contexto ROOT (login, antes de existir sessão, e a limpeza diária).
 * O código é achado sempre pelo jti do desafio assinado.
 */
public interface CodigoVerificacaoRepository extends JpaRepository<CodigoVerificacao, UUID> {

    /**
     * Sempre com trava: no reenvio, dois cliques simultâneos não mandam dois e-mails;
     * na validação, um reenvio no mesmo instante espera em vez de dar conflito de versão.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT c FROM CodigoVerificacao c
            WHERE c.desafioJti = :jti
            """)
    Optional<CodigoVerificacao> buscarPorDesafioComBloqueio(@Param("jti") UUID jti);

    /** Login novo = desafio novo; conta bloqueada: os códigos anteriores do usuário deixam de existir. */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            DELETE FROM CodigoVerificacao c
            WHERE c.usuarioId = :usuarioId
            """)
    int apagarDoUsuario(@Param("usuarioId") UUID usuarioId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            DELETE FROM CodigoVerificacao c
            WHERE c.desafioJti = :jti
            """)
    int apagarPorDesafio(@Param("jti") UUID jti);

    /** Limpeza diária: código vencido ou já usado não serve para mais nada. */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            DELETE FROM CodigoVerificacao c
            WHERE c.expiraEm <= :agora OR c.usadoEm IS NOT NULL
            """)
    int apagarVencidosOuUsados(@Param("agora") Instant agora);
}
