package com.api.ero_api.auxiliar.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.UUID;

/**
 * Item de combo. A {@code chave} (nula nos itens do contratante) deixa o front achar um
 * item do sistema pela constante, sem depender do nome (ex.: o cadastro rápido de pessoa
 * já marca "Cliente" e usa "Celular").
 */
@Schema(description = "Tipo de rede social para seleção")
public record TipoRedeSocialSelectDto(
        UUID id,
        String nome,
        @Schema(description = "Chave do item do sistema (ex.: INSTAGRAM); nula = item do contratante") String chave,
        @Schema(description = "false = inativo (só vem com inativos=true; a tela mostra \"Nome (inativo)\")") boolean ativo) {
}
