package com.api.ero_api.permissao.enums;

/**
 * Permissões extras, além de ler/escrever, que alguns grupos têm
 * (ex.: "liberar acesso de outros usuários", "ver negócios de todos").
 *
 * <p>Cada ação pertence a um grupo (declarado em {@link GrupoLiberacao}) e só
 * pode ser concedida se o grupo estiver liberado. Vira a authority
 * {@code <NOME_DA_ACAO>}: {@code @PreAuthorize("hasAuthority('USUARIOS_LIBERAR_ACESSO')")}.
 */
public enum Acao {

    USUARIOS_LIBERAR_ACESSO("Liberar acesso (permissões) de outros usuários");

    private final String rotulo;

    Acao(String rotulo) {
        this.rotulo = rotulo;
    }

    public String rotulo() {
        return rotulo;
    }

    public String authority() {
        return name();
    }
}
