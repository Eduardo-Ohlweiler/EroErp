package com.api.ero_api.pessoa.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.UUID;

/**
 * Rede social na entrada da pessoa: usuário, link ou os dois (vazios os dois = 400 no
 * service). Sem {@code id}: a lista que chega substitui a anterior.
 */
@Schema(description = "Rede social da pessoa")
public record PessoaRedeSocialItemDto(

        @Schema(description = "Id do tipo de rede social (/api/tipos-rede-social/selecao)")
        @NotNull(message = "Tipo é obrigatório")
        UUID tipoId,

        @Schema(example = "@empresa")
        @Size(max = 255, message = "Usuário deve ter no máximo 255 caracteres")
        String usuario,

        @Schema(description = "Só http:// ou https://", example = "https://instagram.com/empresa")
        @Size(max = 500, message = "Link deve ter no máximo 500 caracteres")
        @Pattern(regexp = "^$|^https?://\\S+$", message = "Link deve começar com http:// ou https://")
        String url) {

    /** Usuário e link identificam a pessoa: fora de qualquer log. */
    @Override
    public String toString() {
        return "PessoaRedeSocialItemDto[tipoId=" + tipoId + "]";
    }
}
