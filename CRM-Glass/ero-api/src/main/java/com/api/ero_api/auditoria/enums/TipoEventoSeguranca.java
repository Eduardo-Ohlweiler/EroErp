package com.api.ero_api.auditoria.enums;

/**
 * O que fica registrado na trilha de segurança (OWASP A09).
 * A coluna não tem CHECK: valor novo não precisa de migration (e eventos antigos
 * de tipos que deixaram de existir não são gravados de novo).
 */
public enum TipoEventoSeguranca {
    LOGIN_SUCESSO,
    LOGIN_FALHA,
    CONTA_BLOQUEADA,
    CONTA_DESBLOQUEADA,
    LOGOUT,
    SESSAO_ENCERRADA,
    REFRESH_REUTILIZADO,
    SENHA_ALTERADA,
    SENHA_REDEFINIDA,
    /** Código errado, vencido ou já usado na segunda etapa do login. */
    DOIS_FATORES_FALHA,
    /** Código do login enviado por e-mail (1º envio). */
    CODIGO_ENVIADO,
    /** Mesmo código reenviado a pedido do usuário. */
    CODIGO_REENVIADO,
    /**
     * Senha certa, mas o limite de códigos novos por hora já tinha sido atingido (o
     * login respondeu 429). No máximo um por usuário dentro da janela de 1 hora.
     */
    CODIGO_LIMITE_ATINGIDO,
    /** O servidor de e-mail recusou ou não respondeu (o login respondeu 503). */
    EMAIL_FALHA_ENVIO,
    USUARIO_CRIADO,
    USUARIO_ALTERADO,
    USUARIO_INATIVADO,
    USUARIO_ATIVADO,
    PERMISSOES_ALTERADAS,
    TENANT_CRIADO,
    TENANT_ALTERADO,
    TENANT_INATIVADO,
    TENANT_ATIVADO,
    SUPERADMIN_ACESSOU_TENANT,
    SUPERADMIN_SAIU_TENANT
}
