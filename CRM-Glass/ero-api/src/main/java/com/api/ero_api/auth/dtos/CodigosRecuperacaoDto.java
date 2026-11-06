package com.api.ero_api.auth.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Códigos de recuperação — mostrados uma única vez")
public record CodigosRecuperacaoDto(List<String> codigos) {

    @Override
    public String toString() {
        return "CodigosRecuperacaoDto[***]";
    }
}
