package com.api.ero_erp.grupoacesso.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record GrupoAcessoCreateDto(

        @Schema(description = "Nome do grupo de acesso", example = "Financeiro")
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 100, message = "Nome deve ter no máximo 100 caracteres")
        String nome,

        @Schema(description = "Descrição do grupo de acesso", example = "Acesso aos módulos financeiros")
        @Size(max = 255, message = "Descrição deve ter no máximo 255 caracteres")
        String descricao,

        @Schema(
                description = "Nome das roles do grupo",
                example = "[FINANCEIRO, PEDIDO]"
        )
        Set<String> roleIds
) {}
