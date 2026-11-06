package com.api.ero_api.tenant.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Schema(description = "Dados para alterar um contratante")
public record TenantUpdateDto(

        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 150, message = "Nome deve ter no máximo 150 caracteres")
        String nome,

        @Size(max = 18, message = "Documento inválido")
        String documento,

        @Email(message = "E-mail inválido")
        @Size(max = 255, message = "E-mail deve ter no máximo 255 caracteres")
        String email,

        @NotNull(message = "Informe se exige verificação em duas etapas")
        Boolean exige2fa,

        @NotBlank(message = "Cor de destaque é obrigatória")
        @Pattern(regexp = "violeta|azul|laranja|esmeralda|rosa|ambar", message = "Cor de destaque inválida")
        String corDestaque,

        @NotNull(message = "Versão é obrigatória")
        Long version) {
}
