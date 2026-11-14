package com.api.ero_api.auth.mapper;

import com.api.ero_api.auth.dtos.CodigoEnviadoDto;
import com.api.ero_api.auth.dtos.UsuarioLogadoDto;
import com.api.ero_api.auth.entity.CodigoVerificacao;
import com.api.ero_api.compartilhado.util.LogSeguro;
import com.api.ero_api.permissao.enums.GrupoLiberacao;
import com.api.ero_api.seguranca.UsuarioAutenticado;
import com.api.ero_api.seguranca.tenant.TenantContext;
import com.api.ero_api.tenant.entity.Tenant;
import com.api.ero_api.tenant.enums.TemaInterface;
import com.api.ero_api.tenant.mapper.TenantMapper;
import com.api.ero_api.usuario.enums.Papel;
import java.time.Instant;
import java.util.List;

public final class AuthMapper {

    private AuthMapper() {
    }

    /**
     * @param temaPreferido escolha pessoal do usuário ({@code null} = segue o tema padrão
     *                      de {@code tenantAtuacao}); vale também para o superadmin atuando
     *                      num contratante
     */
    public static UsuarioLogadoDto toUsuarioLogadoDto(UsuarioAutenticado u, Tenant tenantAtuacao,
                                                      TemaInterface temaPreferido) {
        return new UsuarioLogadoDto(
                u.usuarioId(),
                u.nome(),
                u.email(),
                u.papel(),
                tenantAtuacao.getId(),
                tenantAtuacao.getNome(),
                TenantMapper.toAparenciaDto(tenantAtuacao),
                temaPreferido,
                u.papel() == Papel.SUPERADMIN && !tenantAtuacao.getId().equals(TenantContext.ROOT),
                u.pendencia(),
                List.copyOf(u.authorities()),
                GrupoLiberacao.telasLiberadas(u.authorities()));
    }

    /** Nunca leva o código: só para onde foi (mascarado), até quando vale e quando dá para reenviar. */
    public static CodigoEnviadoDto toCodigoEnviadoDto(CodigoVerificacao c, String email, Instant reenvioDisponivelEm) {
        return new CodigoEnviadoDto(LogSeguro.email(email), c.getExpiraEm(), reenvioDisponivelEm);
    }
}
