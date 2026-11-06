package com.api.ero_api.usuario.dtos;

import com.api.ero_api.usuario.enums.Papel;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Edição completa (PUT): o formulário manda todos os campos de novo.
 * {@code version} é a versão que o usuário viu; se alguém salvou antes, dá 409.
 */
@Schema(description = "Dados para alterar um usuário")
public record UsuarioUpdateDto(

        @Schema(description = "Nome completo", example = "Marina Souza")
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 150, message = "Nome deve ter no máximo 150 caracteres")
        String nome,

        @Schema(description = "E-mail de acesso", example = "marina@empresa.com.br")
        @NotBlank(message = "E-mail é obrigatório")
        @Email(message = "E-mail inválido")
        @Size(max = 255, message = "E-mail deve ter no máximo 255 caracteres")
        String email,

        @Schema(description = "ADMIN ou USUARIO", example = "USUARIO")
        @NotNull(message = "Papel é obrigatório")
        Papel papel,

        @Schema(description = "Versão do registro que está sendo editado", example = "3")
        @NotNull(message = "Versão é obrigatória")
        Long version) {
}
