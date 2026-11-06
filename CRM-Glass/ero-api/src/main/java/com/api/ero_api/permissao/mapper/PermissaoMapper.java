package com.api.ero_api.permissao.mapper;

import com.api.ero_api.permissao.dtos.CatalogoGrupoDto;
import com.api.ero_api.permissao.dtos.CatalogoGrupoDto.CatalogoItemDto;
import com.api.ero_api.permissao.dtos.LiberacaoItemDto;
import com.api.ero_api.permissao.dtos.LiberacoesResponseDto;
import com.api.ero_api.permissao.entity.UsuarioAcao;
import com.api.ero_api.permissao.entity.UsuarioLiberacao;
import com.api.ero_api.permissao.enums.Acao;
import com.api.ero_api.permissao.enums.GrupoLiberacao;
import com.api.ero_api.permissao.enums.NivelAcesso;
import com.api.ero_api.usuario.entity.Usuario;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

public final class PermissaoMapper {

    private PermissaoMapper() {
    }

    public static CatalogoGrupoDto toCatalogoDto(GrupoLiberacao g) {
        return new CatalogoGrupoDto(
                g.name(),
                g.rotulo(),
                g.telas().stream().map(t -> new CatalogoItemDto(t.codigo(), t.rotulo())).toList(),
                g.acoes().stream().map(a -> new CatalogoItemDto(a.name(), a.rotulo())).toList());
    }

    public static LiberacoesResponseDto toResponseDto(Usuario usuario, List<UsuarioLiberacao> liberacoes,
                                                      List<UsuarioAcao> acoes) {
        return new LiberacoesResponseDto(
                usuario.getId(),
                usuario.getPapel(),
                liberacoes.stream().map(l -> new LiberacaoItemDto(l.getGrupo(), l.getNivel())).toList(),
                acoes.stream().map(UsuarioAcao::getAcao).collect(Collectors.toCollection(LinkedHashSet::new)),
                usuario.getVersion());
    }

    public static UsuarioLiberacao toEntity(UUID usuarioId, GrupoLiberacao grupo, NivelAcesso nivel) {
        UsuarioLiberacao l = new UsuarioLiberacao();
        l.setUsuarioId(usuarioId);
        l.setGrupo(grupo);
        l.setNivel(nivel);
        return l;
    }

    public static UsuarioAcao toEntity(UUID usuarioId, Acao acao) {
        UsuarioAcao a = new UsuarioAcao();
        a.setUsuarioId(usuarioId);
        a.setAcao(acao);
        return a;
    }
}
