package com.api.ero_api.tenant.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Dados cadastrais. A aparência muda em PUT /api/tenants/{id}/configuracao. */
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

        @Schema(description = "Quantos usuários ativos o contratante pode ter. Abaixo do uso atual só trava criar e reativar", example = "5")
        @NotNull(message = "Limite de usuários é obrigatório")
        @Min(value = 1, message = "Limite de usuários deve ser pelo menos 1")
        @Max(value = 10000, message = "Limite de usuários deve ser no máximo 10000")
        Integer limiteUsuarios,

        @NotNull(message = "Versão é obrigatória")
        Long version) {
}
