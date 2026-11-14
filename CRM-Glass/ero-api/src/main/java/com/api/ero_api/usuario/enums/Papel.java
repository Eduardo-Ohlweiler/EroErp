package com.api.ero_api.usuario.enums;

/**
 * Papel do usuário. Define o "teto"; o detalhe por tela vem dos grupos de
 * liberação ({@code permissao}).
 */
public enum Papel {

    /** Dono da plataforma. Acesso a tudo, inclusive contratantes. Nunca criado pela API. */
    SUPERADMIN,

    /**
     * Administrador do contratante: recebe todos os grupos e ações do contratante e
     * administra os usuários dele (nunca a si mesmo). O contratante tem sempre pelo
     * menos um ADMIN ativo (ver docs/04-permissoes.md).
     */
    ADMIN,

    /** Usuário comum: só o que estiver liberado nos grupos. */
    USUARIO
}
