package com.api.ero_api.pessoa.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

/** E-mail na entrada da pessoa. Sem {@code id}: a lista que chega substitui a anterior. */
@Schema(description = "E-mail da pessoa")
public record PessoaEmailItemDto(

        @Schema(description = "Id do tipo de e-mail (/api/tipos-email/selecao)")
        @NotNull(message = "Tipo é obrigatório")
        UUID tipoId,

        @Schema(example = "contato@empresa.com.br")
        @NotBlank(message = "E-mail é obrigatório")
        @Email(message = "E-mail inválido")
        @Size(max = 255, message = "E-mail deve ter no máximo 255 caracteres")
        String email,

        @Size(max = 255, message = "Observação deve ter no máximo 255 caracteres")
        String observacao,

        @Schema(description = "E-mail principal (no máximo um; nenhum marcado = o primeiro)")
        @NotNull(message = "Principal é obrigatório")
        Boolean principal) {

    /** E-mail é dado pessoal: fora de qualquer log. */
    @Override
    public String toString() {
        return "PessoaEmailItemDto[tipoId=" + tipoId + ", principal=" + principal + "]";
    }
}
