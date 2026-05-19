package com.api.ero_erp.redesocial.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;

public record RedeSocialResponseDto(
        @Schema(description = "ID da rede social", example = "10")
        Long id,

        @Schema(description = "ID da pessoa", example = "1")
        Long pessoaId,

        @Schema(description = "ID do tipo de rede social", example = "2")
        Long tipoRedeSocialId,

        @Schema(description = "Descrição do tipo de rede social", example = "Instagram")
        String tipoRedeSocialNome,

        @Schema(description = "Usuário na rede social", example = "@joaosilva")
        String usuario,

        @Schema(description = "URL do perfil")
        String url,

        @Schema(description = "Observação")
        String observacao,

        @Schema(description = "Data de criação")
        LocalDateTime createdAt,

        @Schema(description = "Data de atualização")
        LocalDateTime updatedAt
) {}