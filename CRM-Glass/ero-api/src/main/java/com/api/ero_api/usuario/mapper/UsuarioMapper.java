package com.api.ero_api.usuario.mapper;

import com.api.ero_api.usuario.dtos.UsuarioCreateDto;
import com.api.ero_api.usuario.dtos.UsuarioResponseDto;
import com.api.ero_api.usuario.dtos.UsuarioSelectDto;
import com.api.ero_api.usuario.dtos.UsuarioUpdateDto;
import com.api.ero_api.usuario.entity.Usuario;
import java.util.Locale;

/**
 * Conversão entidade ↔ DTO, à mão e sem regra de negócio.
 * O que é regra (hash de senha, permissão para mudar papel...) fica no service.
 */
public final class UsuarioMapper {

    private UsuarioMapper() {
    }

    public static UsuarioResponseDto toResponseDto(Usuario u) {
        return new UsuarioResponseDto(
                u.getId(),
                u.getNome(),
                u.getEmail(),
                u.getPapel(),
                u.isAtivo(),
                u.isExigirTrocaSenha(),
                u.isTotpAtivo(),
                u.getUltimoLoginEm(),
                u.getBloqueadoAte(),
                u.getCreatedAt(),
                u.getUpdatedAt(),
                u.getCreatedBy(),
                u.getUpdatedBy(),
                u.getVersion());
    }

    public static UsuarioSelectDto toSelectDto(Usuario u) {
        return new UsuarioSelectDto(u.getId(), u.getNome());
    }

    /** Senha não entra aqui: o service grava o hash. */
    public static Usuario toEntity(UsuarioCreateDto dto) {
        Usuario u = new Usuario();
        u.setNome(dto.nome().trim());
        u.setEmail(normalizarEmail(dto.email()));
        u.setPapel(dto.papel());
        u.setAtivo(true);
        u.setExigirTrocaSenha(true);
        return u;
    }

    public static void atualizarEntidade(Usuario u, UsuarioUpdateDto dto) {
        u.setNome(dto.nome().trim());
        u.setEmail(normalizarEmail(dto.email()));
        u.setPapel(dto.papel());
    }

    public static String normalizarEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}
