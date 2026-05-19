package com.api.ero_erp.redesocial.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RedeSocialItemDto(
        @Schema(description = "ID da rede social (null para novos)", example = "10")
        Long id,

        @Schema(description = "ID do tipo de rede social", example = "2")
        @NotNull(message = "Tipo de rede social é obrigatório")
        Long tipoRedeSocialId,

        @Schema(description = "Usuário/arroba na rede social", example = "@joaosilva")
        @Size(max = 255)
        String usuario,

        @Schema(description = "URL do perfil", example = "https://instagram.com/joaosilva")
        @Size(max = 500)
        String url,

        @Schema(description = "Observação")
        @Size(max = 255)
        String observacao
) {}