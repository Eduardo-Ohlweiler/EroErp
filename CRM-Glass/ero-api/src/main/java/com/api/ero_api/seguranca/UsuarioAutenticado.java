package com.api.ero_api.seguranca;

import com.api.ero_api.usuario.enums.Papel;
import java.util.Set;
import java.util.UUID;

/**
 * Quem está fazendo a requisição. Montado a cada requisição a partir do token +
 * banco (ver {@code AutorizacaoService}), então inativar usuário, revogar sessão
 * ou mudar permissão vale em segundos, sem esperar o token expirar.
 *
 * @param tenantId    tenant em que o usuário está atuando agora (o superadmin pode
 *                    escolher um contratante; ROOT = visão de plataforma)
 * @param pendencia   algo que o usuário precisa resolver antes de usar o sistema
 * @param authorities o que ele pode fazer (ROLE_*, GRUPO_LER, GRUPO_ESCREVER, ações)
 */
public record UsuarioAutenticado(
        UUID usuarioId,
        UUID tenantId,
        UUID sessaoId,
        String nome,
        String email,
        Papel papel,
        Pendencia pendencia,
        Set<String> authorities) {

    /**
     * Authority de quem está logado E sem pendência. Use no lugar de
     * {@code isAuthenticated()} em rotas comuns: quem ainda precisa trocar a
     * senha ou configurar o 2FA não deve enxergar dados.
     */
    public static final String ACESSO_LIBERADO = "ACESSO_LIBERADO";

    public enum Pendencia {
        NENHUMA,
        /** Senha temporária: só pode trocar a senha. */
        TROCAR_SENHA,
        /** O contratante exige 2FA e o usuário ainda não configurou. */
        CONFIGURAR_2FA
    }

    public boolean superadmin() {
        return papel == Papel.SUPERADMIN;
    }
}
