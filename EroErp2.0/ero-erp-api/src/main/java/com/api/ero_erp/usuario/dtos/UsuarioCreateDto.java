package com.api.ero_erp.usuario.dtos;

import com.api.ero_erp.config.validacao.SenhaBcrypt;
import com.api.ero_erp.permissao.dtos.PermissaoDto;
import com.api.ero_erp.tenant.enums.PeriodoAcesso;
import com.api.ero_erp.usuario.enums.Role;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record UsuarioCreateDto(

        @NotBlank(message = "Informe o nome")
        @Size(max = 255, message = "No máximo 255 caracteres")
        String nome,

        @NotBlank(message = "Informe o e-mail")
        @Email(message = "E-mail inválido")
        @Size(max = 255, message = "No máximo 255 caracteres")
        String email,

        @NotBlank(message = "Informe a senha")
        @Size(min = 10, message = "A senha deve ter no mínimo 10 caracteres")
        @SenhaBcrypt
        String senha,

        @Size(max = 20, message = "No máximo 20 caracteres")
        String telefone,

        @Pattern(regexp = "\\d{1,4}", message = "Código do país inválido")
        String codigoPais,

        Role role,

        UUID tenantId,

        /**
         * Licença do cliente. Só vale quando o tenant nasce aqui — entrando num
         * tenant existente é ignorado, como acontece com a {@code role} no
         * caminho de cliente novo. Nulo é {@code INDETERMINADO}.
         */
        PeriodoAcesso periodoAcesso,

        /**
         * Telas liberadas, só para o nível USER — nos outros é ignorada. Nula
         * ou vazia: o usuário nasce sem acesso aos módulos.
         */
        @Valid
        List<PermissaoDto> permissoes
) {}
