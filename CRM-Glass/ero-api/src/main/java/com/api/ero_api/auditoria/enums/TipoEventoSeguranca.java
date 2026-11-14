package com.api.ero_api.auditoria.enums;

import static com.api.ero_api.auditoria.enums.CategoriaEvento.ACESSOS;
import static com.api.ero_api.auditoria.enums.CategoriaEvento.CONTRATANTES;
import static com.api.ero_api.auditoria.enums.CategoriaEvento.FALHAS;
import static com.api.ero_api.auditoria.enums.CategoriaEvento.SENHA;
import static com.api.ero_api.auditoria.enums.CategoriaEvento.SUPORTE;
import static com.api.ero_api.auditoria.enums.CategoriaEvento.USUARIOS;

/**
 * O que fica registrado na trilha de segurança (OWASP A09).
 * A coluna não tem CHECK: valor novo não precisa de migration (e eventos antigos
 * de tipos que deixaram de existir não são gravados de novo).
 *
 * <p>Cada tipo tem o rótulo da tela Logs, a categoria do filtro e se é uma falha
 * (o front destaca). Tipo novo nasce com os três (o teste confere o rótulo).
 */
public enum TipoEventoSeguranca {
    LOGIN_SUCESSO("Login realizado", ACESSOS, false),
    LOGIN_FALHA("Falha no login", FALHAS, true),
    CONTA_BLOQUEADA("Conta bloqueada por excesso de tentativas", FALHAS, true),
    CONTA_DESBLOQUEADA("Conta desbloqueada pelo administrador", FALHAS, false),
    LOGOUT("Saída do sistema", ACESSOS, false),
    SESSAO_ENCERRADA("Sessão encerrada", ACESSOS, false),
    REFRESH_REUTILIZADO("Sessão encerrada por reuso de credencial", FALHAS, true),
    SENHA_ALTERADA("Senha alterada", SENHA, false),
    SENHA_REDEFINIDA("Senha redefinida pelo administrador", SENHA, false),
    /** Código errado, vencido ou já usado na segunda etapa do login. */
    DOIS_FATORES_FALHA("Código de login inválido", FALHAS, true),
    /** Código do login enviado por e-mail (1º envio). */
    CODIGO_ENVIADO("Código de login enviado", ACESSOS, false),
    /** Mesmo código reenviado a pedido do usuário. */
    CODIGO_REENVIADO("Código de login reenviado", ACESSOS, false),
    /**
     * Senha certa, mas o limite de códigos novos por hora já tinha sido atingido (o
     * login respondeu 429). No máximo um por usuário dentro da janela de 1 hora.
     */
    CODIGO_LIMITE_ATINGIDO("Limite de códigos por hora atingido", FALHAS, true),
    /** O servidor de e-mail recusou ou não respondeu (o login respondeu 503). */
    EMAIL_FALHA_ENVIO("Falha no envio do e-mail", FALHAS, true),
    USUARIO_CRIADO("Usuário cadastrado", USUARIOS, false),
    USUARIO_ALTERADO("Usuário alterado", USUARIOS, false),
    USUARIO_INATIVADO("Usuário inativado", USUARIOS, false),
    USUARIO_ATIVADO("Usuário reativado", USUARIOS, false),
    PERMISSOES_ALTERADAS("Permissões alteradas", USUARIOS, false),
    TENANT_CRIADO("Contratante cadastrado", CONTRATANTES, false),
    TENANT_ALTERADO("Contratante alterado", CONTRATANTES, false),
    TENANT_INATIVADO("Contratante inativado", CONTRATANTES, false),
    TENANT_ATIVADO("Contratante reativado", CONTRATANTES, false),
    SUPERADMIN_ACESSOU_TENANT("Suporte acessou o contratante", SUPORTE, false),
    SUPERADMIN_SAIU_TENANT("Suporte saiu do contratante", SUPORTE, false);

    private final String rotulo;
    private final CategoriaEvento categoria;
    private final boolean falha;

    TipoEventoSeguranca(String rotulo, CategoriaEvento categoria, boolean falha) {
        this.rotulo = rotulo;
        this.categoria = categoria;
        this.falha = falha;
    }

    public String rotulo() {
        return rotulo;
    }

    public CategoriaEvento categoria() {
        return categoria;
    }

    public boolean falha() {
        return falha;
    }
}
