package com.api.ero_api.auth.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * O próprio usuário altera o nome e o telefone. Sem e-mail (é o segundo fator do login:
 * quem troca é o administrador), sem papel e sem id: o id vem sempre da sessão.
 * {@code version} é a que a tela viu; se um administrador salvou a ficha antes, dá 409.
 */
@Schema(description = "Alteração dos meus dados")
public record MeuPerfilUpdateDto(

        @Schema(description = "Nome completo", example = "Marina Souza")
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 150, message = "Nome deve ter no máximo 150 caracteres")
        String nome,

        @Schema(description = "Telefone com DDD, só dígitos (10 ou 11). Vazio ou nulo = não informado", example = "11987654321")
        @Pattern(regexp = "^(\\d{10,11})?$", message = "Telefone deve ter 10 ou 11 dígitos")
        String telefone,

        @Schema(description = "Versão do meu cadastro que a tela mostrou", example = "3")
        @NotNull(message = "Versão é obrigatória")
        Long version) {

    /** Telefone é dado pessoal: fora de qualquer log. */
    @Override
    public String toString() {
        return "MeuPerfilUpdateDto[nome=" + nome + ", version=" + version + "]";
    }
}
