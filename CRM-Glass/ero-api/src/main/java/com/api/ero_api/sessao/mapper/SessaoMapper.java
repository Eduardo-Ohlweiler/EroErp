package com.api.ero_api.sessao.mapper;

import com.api.ero_api.sessao.dtos.SessaoResponseDto;
import com.api.ero_api.sessao.entity.SessaoUsuario;
import java.util.UUID;

public final class SessaoMapper {

    private SessaoMapper() {
    }

    public static SessaoResponseDto toResponseDto(SessaoUsuario s, UUID sessaoAtualId) {
        return new SessaoResponseDto(
                s.getId(),
                s.getIp(),
                s.getUserAgent(),
                s.getCreatedAt(),
                s.getUltimoUsoEm(),
                s.getExpiraEm(),
                s.getId().equals(sessaoAtualId));
    }
}
