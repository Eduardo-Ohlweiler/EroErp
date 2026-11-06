package com.api.ero_api.usuario.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.UUID;

/** Item de combo/autocomplete (responsável, participante...). */
@Schema(description = "Usuário para seleção")
public record UsuarioSelectDto(UUID id, String nome) {
}
