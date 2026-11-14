package com.api.ero_api.auditoria.enums;

/**
 * Agrupamento dos tipos de evento para o filtro da tela Logs. O front escolhe a
 * categoria e manda os tipos dela em {@code tipos} (ver {@code GET /api/auditoria/tipos}).
 * Não vai para o banco: mudar a categoria de um tipo não precisa de migration.
 */
public enum CategoriaEvento {
    ACESSOS("Acessos"),
    FALHAS("Falhas e bloqueios"),
    SENHA("Senha"),
    USUARIOS("Usuários e permissões"),
    CONTRATANTES("Contratantes"),
    SUPORTE("Suporte da plataforma");

    private final String rotulo;

    CategoriaEvento(String rotulo) {
        this.rotulo = rotulo;
    }

    public String rotulo() {
        return rotulo;
    }
}
