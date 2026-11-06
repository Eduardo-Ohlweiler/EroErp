package com.api.ero_api.auth.service;

import com.api.ero_api.auth.repository.CodigoRecuperacaoRepository;
import com.api.ero_api.seguranca.autorizacao.AutorizacaoCache;
import com.api.ero_api.usuario.entity.Usuario;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Desliga o 2FA de um usuário (segredo, passo e códigos de recuperação).
 *
 * <p>Separado do DoisFatoresService para não depender do UsuarioService: assim o
 * UsuarioService pode chamá-lo (admin redefinindo o 2FA de alguém) sem ciclo.
 * Não faz checagem de permissão: quem chama já decidiu que pode.
 */
@Service
public class DoisFatoresLimpezaService {

    private final CodigoRecuperacaoRepository codigoRepository;
    private final AutorizacaoCache cache;

    public DoisFatoresLimpezaService(CodigoRecuperacaoRepository codigoRepository, AutorizacaoCache cache) {
        this.codigoRepository = codigoRepository;
        this.cache = cache;
    }

    @Transactional
    public void desligar(Usuario u) {
        u.setTotpAtivo(false);
        u.setTotpSegredo(null);
        u.setTotpUltimoPasso(null);
        codigoRepository.deleteAll(codigoRepository.buscarDoUsuario(u.getId()));
        cache.invalidarUsuario(u.getId());
    }
}
