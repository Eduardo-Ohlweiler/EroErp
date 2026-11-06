package com.api.ero_api.sessao.enums;

/** Por que uma sessão foi encerrada antes de expirar. */
public enum MotivoRevogacao {
    LOGOUT,
    ENCERRADA_PELO_USUARIO,
    TROCA_SENHA,
    SENHA_REDEFINIDA,
    REUTILIZACAO_REFRESH,
    USUARIO_INATIVADO,
    DOIS_FATORES_ALTERADO
}
