package com.api.ero_api.auth.dtos;

import com.api.ero_api.tenant.enums.TemaInterface;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Troca do próprio tema. {@code null} (ou campo ausente) volta a seguir o tema padrão
 * do contratante. Valor fora do enum é recusado na leitura do corpo (400).
 */
@Schema(description = "Troca do próprio tema (claro ou escuro)")
public record TrocarTemaDto(
        @Schema(description = "CLARO, ESCURO ou null para seguir o tema padrão do contratante",
                example = "CLARO", nullable = true)
        TemaInterface tema) {
}
