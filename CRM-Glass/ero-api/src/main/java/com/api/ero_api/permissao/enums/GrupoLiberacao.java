package com.api.ero_api.permissao.enums;

import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Grupos de liberação: o que o administrador marca para cada usuário.
 *
 * <p>Liberar o grupo PESSOAS libera as telas dele (pessoa-list, pessoa-form);
 * o nível diz se é só leitura ou se também grava. Algumas telas têm ações extras.
 *
 * <p>Cada grupo vira duas authorities:
 * <pre>
 *   &#64;PreAuthorize("hasAuthority('USUARIOS_LER')")       // GET
 *   &#64;PreAuthorize("hasAuthority('USUARIOS_ESCREVER')")  // POST/PUT/PATCH
 * </pre>
 *
 * <p>O nome da constante é gravado no banco ({@code usuario_liberacao.grupo}) e
 * vai para o front: renomear exige migration. Toda tela nova nasce com o seu grupo.
 */
public enum GrupoLiberacao {

    USUARIOS("Usuários",
            List.of(Tela.USUARIO_LIST, Tela.USUARIO_FORM),
            List.of(Acao.USUARIOS_LIBERAR_ACESSO)),

    AUDITORIA("Auditoria",
            List.of(Tela.AUDITORIA_LIST),
            List.of());

    private final String rotulo;
    private final List<Tela> telas;
    private final List<Acao> acoes;

    GrupoLiberacao(String rotulo, List<Tela> telas, List<Acao> acoes) {
        this.rotulo = rotulo;
        this.telas = telas;
        this.acoes = acoes;
    }

    public String rotulo() {
        return rotulo;
    }

    public List<Tela> telas() {
        return telas;
    }

    public List<Acao> acoes() {
        return acoes;
    }

    public String authorityLer() {
        return name() + "_LER";
    }

    public String authorityEscrever() {
        return name() + "_ESCREVER";
    }

    public static Optional<GrupoLiberacao> daAcao(Acao acao) {
        return Arrays.stream(values()).filter(g -> g.acoes.contains(acao)).findFirst();
    }

    /** Códigos das telas liberadas por um conjunto de authorities (menu do front). */
    public static List<String> telasLiberadas(Collection<String> authorities) {
        return Arrays.stream(values())
                .filter(g -> authorities.contains(g.authorityLer()))
                .flatMap(g -> g.telas.stream().map(Tela::codigo))
                .toList();
    }
}
