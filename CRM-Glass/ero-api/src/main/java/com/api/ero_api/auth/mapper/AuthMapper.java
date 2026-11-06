package com.api.ero_api.auth.mapper;

import com.api.ero_api.auth.dtos.UsuarioLogadoDto;
import com.api.ero_api.permissao.enums.GrupoLiberacao;
import com.api.ero_api.seguranca.UsuarioAutenticado;
import com.api.ero_api.seguranca.tenant.TenantContext;
import com.api.ero_api.tenant.entity.Tenant;
import com.api.ero_api.tenant.mapper.TenantMapper;
import com.api.ero_api.usuario.enums.Papel;
import java.util.List;

public final class AuthMapper {

    private AuthMapper() {
    }

    public static UsuarioLogadoDto toUsuarioLogadoDto(UsuarioAutenticado u, Tenant tenantAtuacao) {
        return new UsuarioLogadoDto(
                u.usuarioId(),
                u.nome(),
                u.email(),
                u.papel(),
                tenantAtuacao.getId(),
                tenantAtuacao.getNome(),
                TenantMapper.toAparenciaDto(tenantAtuacao),
                u.papel() == Papel.SUPERADMIN && !tenantAtuacao.getId().equals(TenantContext.ROOT),
                u.pendencia(),
                u.doisFatoresAtivo(),
                u.doisFatoresObrigatorio(),
                List.copyOf(u.authorities()),
                GrupoLiberacao.telasLiberadas(u.authorities()));
    }
}
