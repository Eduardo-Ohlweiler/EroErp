package com.api.ero_erp.usuario.dtos;

import com.api.ero_erp.permissao.dtos.PermissaoDto;
import com.api.ero_erp.usuario.enums.Role;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UsuarioUpdateDto(

        @NotBlank(message = "Informe o nome")
        @Size(max = 255, message = "No máximo 255 caracteres")
        String nome,

        @NotBlank(message = "Informe o e-mail")
        @Email(message = "E-mail inválido")
        @Size(max = 255, message = "No máximo 255 caracteres")
        String email,

        @Size(max = 20, message = "No máximo 20 caracteres")
        String telefone,

        @Pattern(regexp = "\\d{1,4}", message = "Código do país inválido")
        String codigoPais,

        @NotNull(message = "Informe o nível de acesso")
        Role role,

        /**
         * O estado completo das telas liberadas: o que não vem perde o acesso.
         * Só vale para o nível USER; nos outros, o que houver é apagado.
         */
        @Valid
        List<PermissaoDto> permissoes
) {}
