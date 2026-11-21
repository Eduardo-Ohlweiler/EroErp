package com.api.ero_api.pessoa.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.UUID;

/**
 * Telefone na entrada da pessoa. Sem {@code id}: a lista que chega é o estado completo
 * e substitui a anterior (ninguém aponta para a linha de outra pessoa).
 */
@Schema(description = "Telefone da pessoa")
public record PessoaTelefoneItemDto(

        @Schema(description = "Id do tipo de telefone (/api/tipos-telefone/selecao)")
        @NotNull(message = "Tipo é obrigatório")
        UUID tipoId,

        @Schema(description = "Com DDD, só dígitos (10 ou 11)", example = "11987654321")
        @NotBlank(message = "Número é obrigatório")
        @Pattern(regexp = "^\\d{10,11}$", message = "Telefone deve ter 10 ou 11 dígitos")
        String numero,

        @Size(max = 255, message = "Observação deve ter no máximo 255 caracteres")
        String observacao,

        @Schema(description = "Telefone principal (no máximo um; nenhum marcado = o primeiro)")
        @NotNull(message = "Principal é obrigatório")
        Boolean principal) {

    /** Telefone é dado pessoal: fora de qualquer log. */
    @Override
    public String toString() {
        return "PessoaTelefoneItemDto[tipoId=" + tipoId + ", principal=" + principal + "]";
    }
}
