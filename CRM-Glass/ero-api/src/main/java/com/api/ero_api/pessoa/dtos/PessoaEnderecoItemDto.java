package com.api.ero_api.pessoa.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.UUID;

/** Endereço na entrada da pessoa. Sem {@code id}: a lista que chega substitui a anterior. */
@Schema(description = "Endereço da pessoa")
public record PessoaEnderecoItemDto(

        @Schema(description = "Id do tipo de endereço (/api/tipos-endereco/selecao)")
        @NotNull(message = "Tipo é obrigatório")
        UUID tipoId,

        @Schema(description = "Só os 8 dígitos; vazio ou nulo = sem CEP", example = "01001000")
        @Pattern(regexp = "^$|^\\d{8}$", message = "CEP deve ter 8 dígitos")
        String cep,

        @Schema(description = "Id da cidade (/api/cidades/selecao ou /api/cep/{cep})")
        @NotNull(message = "Cidade é obrigatória")
        UUID cidadeId,

        @Size(max = 255, message = "Rua deve ter no máximo 255 caracteres")
        String rua,

        @Size(max = 20, message = "Número deve ter no máximo 20 caracteres")
        String numero,

        @Size(max = 100, message = "Bairro deve ter no máximo 100 caracteres")
        String bairro,

        @Size(max = 100, message = "Complemento deve ter no máximo 100 caracteres")
        String complemento,

        @Schema(description = "Endereço principal (no máximo um; nenhum marcado = o primeiro)")
        @NotNull(message = "Principal é obrigatório")
        Boolean principal) {

    /** Endereço é dado pessoal: fora de qualquer log. */
    @Override
    public String toString() {
        return "PessoaEnderecoItemDto[tipoId=" + tipoId + ", cidadeId=" + cidadeId + ", principal=" + principal + "]";
    }
}
