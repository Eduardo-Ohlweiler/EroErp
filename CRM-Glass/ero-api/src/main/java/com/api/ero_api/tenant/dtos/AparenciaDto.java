package com.api.ero_api.tenant.dtos;

import com.api.ero_api.tenant.enums.Fundo;
import com.api.ero_api.tenant.enums.NivelAnimacao;
import com.api.ero_api.tenant.enums.TemaInterface;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/**
 * Aparência do contratante. Serve de entrada (aninhada no cadastro e na
 * configuração) e de saída ({@code /api/auth/eu}, {@code /api/tenants/atual}).
 * Limites iguais aos controles da tela e aos CHECKs da migration 008.
 */
@Schema(description = "Aparência do contratante (vale para todos os usuários dele)")
public record AparenciaDto(

        @Schema(description = "Cor de destaque", example = "violeta",
                allowableValues = {"violeta", "azul", "laranja", "esmeralda", "rosa", "ambar"})
        @NotBlank(message = "Cor de destaque é obrigatória")
        @Size(max = 20, message = "Cor de destaque inválida")
        @Pattern(regexp = "violeta|azul|laranja|esmeralda|rosa|ambar", message = "Cor de destaque inválida")
        String corDestaque,

        @Schema(description = "Tema padrão da interface", example = "ESCURO")
        @NotNull(message = "Tema é obrigatório")
        TemaInterface temaPadrao,

        @Schema(description = "Fundo (código do catálogo em GET /api/tenants/fundos)", example = "ORBS")
        @NotNull(message = "Fundo é obrigatório")
        Fundo fundo,

        @Schema(description = "Fundo com movimento")
        @NotNull(message = "Informe se o fundo é animado")
        Boolean fundoAnimado,

        @Schema(description = "Intensidade do vidro, em px (0 a 40)", example = "12")
        @NotNull(message = "Intensidade do vidro é obrigatória")
        @Min(value = 0, message = "Intensidade do vidro vai de 0 a 40")
        @Max(value = 40, message = "Intensidade do vidro vai de 0 a 40")
        Integer vidroDesfoque,

        @Schema(description = "Foco do fundo de cena, em px (0 a 10, passo 0,5)", example = "3.0")
        @NotNull(message = "Foco do fundo é obrigatório")
        @DecimalMin(value = "0.0", message = "Foco do fundo vai de 0 a 10")
        @DecimalMax(value = "10.0", message = "Foco do fundo vai de 0 a 10")
        @Digits(integer = 2, fraction = 1, message = "Foco do fundo aceita uma casa decimal")
        BigDecimal fundoFoco,

        @Schema(description = "Animações da interface", example = "COMPLETAS")
        @NotNull(message = "Animações é obrigatório")
        NivelAnimacao animacoes) {
}
