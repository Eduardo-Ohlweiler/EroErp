package com.api.ero_api.pessoa.dtos;

import com.api.ero_api.auxiliar.dtos.TipoRedeSocialSelectDto;
import io.swagger.v3.oas.annotations.media.Schema;

/** Rede social da pessoa como a API devolve (na ordem da lista). */
@Schema(description = "Rede social da pessoa")
public record PessoaRedeSocialResponseDto(
        @Schema(description = "Tipo (ativo = false: inativo, mantido porque já estava gravado)") TipoRedeSocialSelectDto tipo,
        String usuario,
        @Schema(description = "Só http:// ou https://") String url) {

    /** Usuário e link identificam a pessoa: fora de qualquer log. */
    @Override
    public String toString() {
        return "PessoaRedeSocialResponseDto[tipo=" + (tipo == null ? null : tipo.id()) + "]";
    }
}
