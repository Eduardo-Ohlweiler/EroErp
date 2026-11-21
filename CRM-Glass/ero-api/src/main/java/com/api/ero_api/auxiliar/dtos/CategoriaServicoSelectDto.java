package com.api.ero_api.auxiliar.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.UUID;

/**
 * Item de combo (e a categoria dentro do {@code ServicoResponseDto}). A {@code chave} é
 * sempre nula (a categoria não tem itens do sistema): fica só pela forma comum dos
 * auxiliares no front.
 */
@Schema(description = "Categoria de serviço para seleção")
public record CategoriaServicoSelectDto(
        UUID id,
        String nome,
        @Schema(description = "Sempre nula: a categoria de serviço não tem itens do sistema") String chave,
        @Schema(description = "false = inativa (só vem com inativos=true, ou no serviço que já a usava; a tela mostra \"Nome (inativo)\")") boolean ativo) {
}
