package com.api.ero_api.tenant.enums;

/**
 * Tema da interface. Usado em dois lugares: o tema padrão do contratante
 * ({@code Tenant.temaPadrao}, vale para todos os usuários dele) e a escolha
 * pessoal de cada usuário ({@code Usuario.temaPreferido}, que vence o padrão).
 */
public enum TemaInterface {
    ESCURO,
    CLARO
}
