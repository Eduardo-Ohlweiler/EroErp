package com.api.ero_api.filial.dtos;

import com.api.ero_api.filial.enums.TipoFilial;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.util.UUID;

/**
 * Cadastro de filial. A pessoa e a matriz vêm por id e são conferidas no service (de outro
 * contratante ou inexistente: 404). O código é gerado: {@code codFilial} no corpo é ignorado.
 */
@Schema(description = "Dados para cadastrar uma filial")
public record FilialCreateDto(

        @Schema(description = "Pessoa (física ou jurídica) que é a filial; ativa e ainda sem filial")
        @NotNull(message = "Escolha a pessoa")
        UUID pessoaId,

        @Schema(description = "MATRIZ ou FILIAL", example = "MATRIZ")
        @NotNull(message = "Escolha o tipo")
        TipoFilial tipo,

        @Schema(description = "Só na FILIAL: a matriz (ativa) a que ela responde. Vazio na MATRIZ")
        UUID matrizId,

        @Schema(description = "Cor de identificação, #RRGGBB (gravada em maiúsculas)", example = "#3B82F6")
        @NotBlank(message = "Escolha a cor")
        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Cor deve estar no formato #RRGGBB")
        String cor) {
}
