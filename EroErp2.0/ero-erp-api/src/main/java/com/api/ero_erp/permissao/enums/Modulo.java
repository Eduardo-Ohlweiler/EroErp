package com.api.ero_erp.permissao.enums;

/**
 * O que o cadastro de usuário mostra como "módulo" a liberar.
 *
 * <p>Módulo é o <b>assunto que se libera</b>, não o grupo do menu: Pessoas e
 * Filiais moram juntas em "Cadastros" no menu, mas aqui são dois módulos, para
 * o superadmin ver exatamente o que está dando. Um módulo com várias telas
 * (pedido, por exemplo) as agrupa.
 *
 * <p>A ordem das constantes é a ordem em que a tela de usuário os apresenta.
 * Não é gravado — {@code usuario_permissao} guarda só a {@link Tela} —, então
 * reagrupar telas não exige migration. A área administrativa não é módulo: é
 * do superadmin pela role.
 */
public enum Modulo {

    PESSOAS("Pessoas"),
    FILIAIS("Filiais"),
    SERVICOS("Serviços"),
    PRODUTOS("Produtos"),
    ESTOQUE("Estoque"),
    ATENDIMENTO("Agenda e atendimento");

    private final String rotulo;

    Modulo(String rotulo) {
        this.rotulo = rotulo;
    }

    public String rotulo() {
        return rotulo;
    }
}
