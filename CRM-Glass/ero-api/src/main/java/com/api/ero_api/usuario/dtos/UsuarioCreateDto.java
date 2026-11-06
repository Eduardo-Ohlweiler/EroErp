package com.api.ero_api.usuario.dtos;

import com.api.ero_api.usuario.enums.Papel;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Cadastro de usuário dentro do contratante atual.
 * A senha é temporária: o usuário troca no primeiro acesso.
 * Permissões são liberadas depois, em {@code /api/permissoes/usuarios/{id}}.
 */
@Schema(description = "Dados para cadastrar um usuário")
public record UsuarioCreateDto(

        @Schema(description = "Nome completo", example = "Marina Souza")
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 150, message = "Nome deve ter no máximo 150 caracteres")
        String nome,

        @Schema(description = "E-mail de acesso (único no sistema)", example = "marina@empresa.com.br")
        @NotBlank(message = "E-mail é obrigatório")
        @Email(message = "E-mail inválido")
        @Size(max = 255, message = "E-mail deve ter no máximo 255 caracteres")
        String email,

        @Schema(description = "Senha temporária (mínimo 12 caracteres)")
        @NotBlank(message = "Senha é obrigatória")
        @Size(max = 128, message = "Senha deve ter no máximo 128 caracteres")
        String senha,

        @Schema(description = "ADMIN ou USUARIO", example = "USUARIO")
        @NotNull(message = "Papel é obrigatório")
        Papel papel) {

    @Override
    public String toString() {
        return "UsuarioCreateDto[nome=" + nome + ", papel=" + papel + "]";
    }
}
