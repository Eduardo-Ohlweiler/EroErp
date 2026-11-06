package com.api.ero_api.seguranca.autorizacao;

import com.api.ero_api.seguranca.UsuarioAutenticado;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import java.time.Duration;
import java.util.UUID;
import java.util.function.Function;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Guarda por 30 s quem é o usuário de cada sessão (papel, permissões, pendências),
 * para não ir ao banco em toda requisição.
 *
 * <p>Quem altera algo que muda o acesso (permissão, papel, inativação, revogação
 * de sessão, troca de senha, 2FA) chama {@link #invalidarUsuario} ou
 * {@link #invalidarSessao}. A invalidação acontece na hora E de novo depois do
 * commit: assim uma requisição que chegue no meio da transação não guarda o
 * estado antigo. Com várias instâncias, as outras enxergam em até 30 s.
 */
@Component
public class AutorizacaoCache {

    private final Cache<UUID, UsuarioAutenticado> porSessao = Caffeine.newBuilder()
            .expireAfterWrite(Duration.ofSeconds(30))
            .maximumSize(50_000)
            .build();

    public UsuarioAutenticado obter(UUID sessaoId, Function<UUID, UsuarioAutenticado> carregar) {
        return porSessao.get(sessaoId, carregar);
    }

    public void invalidarSessao(UUID sessaoId) {
        agoraEDepoisDoCommit(() -> porSessao.invalidate(sessaoId));
    }

    public void invalidarUsuario(UUID usuarioId) {
        agoraEDepoisDoCommit(() -> porSessao.asMap().values().removeIf(u -> u.usuarioId().equals(usuarioId)));
    }

    public void invalidarTudo() {
        agoraEDepoisDoCommit(porSessao::invalidateAll);
    }

    private static void agoraEDepoisDoCommit(Runnable acao) {
        acao.run();
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCompletion(int status) {
                    acao.run();
                }
            });
        }
    }
}
