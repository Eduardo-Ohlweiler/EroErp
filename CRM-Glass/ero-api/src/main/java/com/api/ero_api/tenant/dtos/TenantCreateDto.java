package com.api.ero_api.tenant.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Novo contratante + o primeiro administrador dele. */
@Schema(description = "Dados para cadastrar um contratante")
public record TenantCreateDto(

        @Schema(description = "Nome do contratante", example = "Solar Energia Ltda")
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 150, message = "Nome deve ter no máximo 150 caracteres")
        String nome,

        @Schema(description = "CNPJ ou CPF (com ou sem máscara)", example = "12.345.678/0001-90")
        @Size(max = 18, message = "Documento inválido")
        String documento,

        @Schema(description = "E-mail de contato", example = "contato@solar.com.br")
        @Email(message = "E-mail inválido")
        @Size(max = 255, message = "E-mail deve ter no máximo 255 caracteres")
        String email,

        @Schema(description = "Exigir verificação em duas etapas de todos os usuários")
        @NotNull(message = "Informe se exige verificação em duas etapas")
        Boolean exige2fa,

        @Schema(description = "Aparência inicial (vazio = padrão do sistema)")
        @Valid
        AparenciaDto aparencia,

        @Schema(description = "Primeiro administrador do contratante")
        @NotNull(message = "Administrador é obrigatório")
        @Valid
        AdminInicialDto administrador) {

    @Schema(description = "Primeiro administrador (senha temporária)")
    public record AdminInicialDto(
            @NotBlank(message = "Nome do administrador é obrigatório")
            @Size(max = 150, message = "Nome deve ter no máximo 150 caracteres")
            String nome,

            @NotBlank(message = "E-mail do administrador é obrigatório")
            @Email(message = "E-mail do administrador inválido")
            @Size(max = 255, message = "E-mail deve ter no máximo 255 caracteres")
            String email,

            @NotBlank(message = "Senha do administrador é obrigatória")
            @Size(max = 128, message = "Senha deve ter no máximo 128 caracteres")
            String senha) {

        @Override
        public String toString() {
            return "AdminInicialDto[nome=" + nome + "]";
        }
    }
}
