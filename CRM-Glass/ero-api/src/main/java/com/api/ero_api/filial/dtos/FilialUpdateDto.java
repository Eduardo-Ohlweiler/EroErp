package com.api.ero_api.filial.dtos;

import com.api.ero_api.filial.enums.TipoFilial;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.util.UUID;

/**
 * Edição completa (PUT). {@code version} é a versão que o usuário viu; se alguém salvou
 * antes, dá 409. A situação não muda aqui: é pelo inativar/ativar.
 */
@Schema(description = "Dados para alterar uma filial")
public record FilialUpdateDto(

        @Schema(description = "Pessoa (física ou jurídica) que é a filial. Trocada: ativa e ainda sem filial")
        @NotNull(message = "Escolha a pessoa")
        UUID pessoaId,

        @Schema(description = "MATRIZ ou FILIAL", example = "FILIAL")
        @NotNull(message = "Escolha o tipo")
        TipoFilial tipo,

        @Schema(description = "Só na FILIAL: a matriz a que ela responde. Vazio na MATRIZ")
        UUID matrizId,

        @Schema(description = "Cor de identificação, #RRGGBB (gravada em maiúsculas)", example = "#10B981")
        @NotBlank(message = "Escolha a cor")
        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Cor deve estar no formato #RRGGBB")
        String cor,

        @Schema(description = "Versão do registro que está sendo editado", example = "3")
        @NotNull(message = "Versão é obrigatória")
        Long version) {
}
