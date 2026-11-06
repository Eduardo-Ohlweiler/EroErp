package com.api.ero_api.permissao.enums;

/**
 * Telas do front. O {@code codigo} é o mesmo nome usado na rota/componente do
 * front (ex.: {@code usuario-list}). Uma tela só aparece no menu se o grupo
 * dela estiver liberado para o usuário.
 *
 * <p>Tela nova: declare aqui E no {@link GrupoLiberacao} correspondente.
 */
public enum Tela {

    USUARIO_LIST("usuario-list", "Usuários — lista"),
    USUARIO_FORM("usuario-form", "Usuários — cadastro"),
    AUDITORIA_LIST("auditoria-list", "Auditoria — eventos de segurança");

    private final String codigo;
    private final String rotulo;

    Tela(String codigo, String rotulo) {
        this.codigo = codigo;
        this.rotulo = rotulo;
    }

    public String codigo() {
        return codigo;
    }

    public String rotulo() {
        return rotulo;
    }
}
