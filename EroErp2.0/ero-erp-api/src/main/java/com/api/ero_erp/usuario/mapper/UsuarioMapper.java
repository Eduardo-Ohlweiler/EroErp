package com.api.ero_erp.usuario.mapper;

import com.api.ero_erp.permissao.dtos.PermissaoDto;
import com.api.ero_erp.usuario.dtos.UsuarioResponseDto;
import com.api.ero_erp.usuario.dtos.UsuarioSelectDto;
import com.api.ero_erp.usuario.entity.Usuario;

import java.util.List;

public final class UsuarioMapper {

    private UsuarioMapper() {}

    /**
     * Para a listagem e o perfil: sem permissões.
     *
     * <p>Permissão não é coleção do usuário — exige consulta própria, e
     * carregá-la por linha na listagem seria um N+1 para mostrar o que a grade
     * nem exibe.
     */
    public static UsuarioResponseDto toResponse(Usuario usuario) {
        return toResponse(usuario, List.of());
    }

    public static UsuarioResponseDto toResponse(Usuario usuario, List<PermissaoDto> permissoes) {
        return new UsuarioResponseDto(
                usuario.getId(),
                usuario.getTenant().getId(),
                usuario.getTenant().getNome(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getTelefone(),
                usuario.getCodigoPais(),
                usuario.getRole(),
                usuario.getAtivo(),
                usuario.estaBloqueado(),
                usuario.getCreatedAt(),
                permissoes);
    }

    public static UsuarioSelectDto toSelect(Usuario usuario) {
        return new UsuarioSelectDto(usuario.getId(), usuario.getNome());
    }
}
