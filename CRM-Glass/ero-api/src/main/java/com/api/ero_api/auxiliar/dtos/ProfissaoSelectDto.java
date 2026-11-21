package com.api.ero_api.auxiliar.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.UUID;

/**
 * Item de combo. A {@code chave} (nula nos itens do contratante) deixa o front achar um
 * item do sistema pela constante, sem depender do nome.
 */
@Schema(description = "Profissão para seleção")
public record ProfissaoSelectDto(
        UUID id,
        String nome,
        @Schema(description = "Chave do item do sistema (ex.: AUTONOMO); nula = item do contratante") String chave,
        @Schema(description = "false = inativo (só vem com inativos=true; a tela mostra \"Nome (inativo)\")") boolean ativo) {
}
