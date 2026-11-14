package com.api.ero_api.compartilhado.exception;

/**
 * 409 de duplicidade num campo (e-mail já em uso, documento de outro contratante).
 * O GlobalExceptionHandler devolve {@code erros: [{campo, mensagem}]}, no mesmo
 * formato do 400, para o front marcar o campo. O 409 de versão desatualizada usa
 * {@link ConflitoException} e sai sem {@code erros}: é assim que o front distingue
 * "corrija este campo" de "recarregue".
 *
 * <p>{@code campo} é o caminho no DTO de entrada ({@code email},
 * {@code administrador.email}), igual ao que o Bean Validation devolveria.
 */
public class ConflitoCampoException extends ConflitoException {

    private final String campo;

    public ConflitoCampoException(String campo, String mensagem) {
        super(mensagem);
        this.campo = campo;
    }

    public String getCampo() {
        return campo;
    }

    /**
     * O mesmo conflito com o campo dentro de um objeto do DTO de quem chamou: o
     * {@code email} do UsuarioService vira {@code administrador.email} no cadastro
     * do contratante.
     */
    public ConflitoCampoException dentroDe(String objeto) {
        return new ConflitoCampoException(objeto + "." + campo, getMessage());
    }
}
