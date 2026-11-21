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
    AUDITORIA_LIST("auditoria-list", "Auditoria — eventos de segurança"),
    PESSOA_LIST("pessoa-list", "Pessoas — lista"),
    PESSOA_FORM("pessoa-form", "Pessoas — cadastro"),
    FILIAL_LIST("filial-list", "Filiais — lista"),
    FILIAL_FORM("filial-form", "Filiais — cadastro"),
    TIPO_CADASTRO_FORMLIST("tipo-cadastro-formlist", "Tipos de cadastro"),
    TIPO_TELEFONE_FORMLIST("tipo-telefone-formlist", "Tipos de telefone"),
    TIPO_EMAIL_FORMLIST("tipo-email-formlist", "Tipos de e-mail"),
    TIPO_ENDERECO_FORMLIST("tipo-endereco-formlist", "Tipos de endereço"),
    TIPO_REDE_SOCIAL_FORMLIST("tipo-rede-social-formlist", "Tipos de rede social"),
    ESTADO_CIVIL_FORMLIST("estado-civil-formlist", "Estados civis"),
    PROFISSAO_FORMLIST("profissao-formlist", "Profissões");

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
