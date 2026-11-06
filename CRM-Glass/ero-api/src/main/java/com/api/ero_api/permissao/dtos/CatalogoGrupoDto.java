package com.api.ero_api.permissao.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

/** Um grupo do catálogo, para a tela de liberar acesso montar os checkboxes. */
@Schema(description = "Grupo de liberação com suas telas e ações")
public record CatalogoGrupoDto(
        @Schema(example = "USUARIOS") String codigo,
        @Schema(example = "Usuários") String rotulo,
        List<CatalogoItemDto> telas,
        List<CatalogoItemDto> acoes) {

    @Schema(description = "Tela ou ação")
    public record CatalogoItemDto(String codigo, String rotulo) {
    }
}
