package com.api.ero_api.usuario.mapper;

import com.api.ero_api.usuario.dtos.UsuarioCreateDto;
import com.api.ero_api.usuario.dtos.UsuarioResponseDto;
import com.api.ero_api.usuario.dtos.UsuarioSelectDto;
import com.api.ero_api.usuario.dtos.UsuarioUpdateDto;
import com.api.ero_api.usuario.entity.Usuario;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Conversão entidade ↔ DTO, à mão e sem regra de negócio.
 * O que é regra (hash de senha, permissão para mudar papel...) fica no service.
 */
public final class UsuarioMapper {

    private UsuarioMapper() {
    }

    /**
     * {@code nomes}: quem cadastrou e quem alterou, já resolvidos pelo service (uma
     * consulta por página, sem N+1, com o filtro de tenant ligado). {@code plataforma}:
     * o superadmin na visão de plataforma vê tudo. Dentro de um contratante o superadmin
     * não está no mapa: o id dele não sai e o nome fica vazio (mesma regra da trilha de logs).
     */
    public static UsuarioResponseDto toResponseDto(Usuario u, Map<UUID, String> nomes, boolean plataforma) {
        return new UsuarioResponseDto(
                u.getId(),
                u.getNome(),
                u.getEmail(),
                u.getTelefone(),
                u.getPapel(),
                u.isAtivo(),
                u.isExigirTrocaSenha(),
                u.getUltimoLoginEm(),
                u.getBloqueadoAte(),
                u.getCreatedAt(),
                u.getUpdatedAt(),
                visivel(nomes, u.getCreatedBy(), plataforma),
                visivel(nomes, u.getUpdatedBy(), plataforma),
                nome(nomes, u.getCreatedBy()),
                nome(nomes, u.getUpdatedBy()),
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
        u.setTelefone(normalizarTelefone(dto.telefone()));
        u.setPapel(dto.papel());
        u.setAtivo(true);
        u.setExigirTrocaSenha(true);
        return u;
    }

    public static void atualizarEntidade(Usuario u, UsuarioUpdateDto dto) {
        u.setNome(dto.nome().trim());
        u.setEmail(normalizarEmail(dto.email()));
        u.setTelefone(normalizarTelefone(dto.telefone()));
        u.setPapel(dto.papel());
    }

    /** Minha conta: o próprio usuário só muda nome e telefone (e-mail e papel ficam com o administrador). */
    public static void atualizarPerfil(Usuario u, String nome, String telefone) {
        u.setNome(nome.trim());
        u.setTelefone(normalizarTelefone(telefone));
    }

    public static String normalizarEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    /** Grava só os dígitos; vazio (o front limpou o campo) vira {@code null} = não informado. */
    public static String normalizarTelefone(String telefone) {
        if (telefone == null) {
            return null;
        }
        String digitos = telefone.replaceAll("\\D", "");
        return digitos.isEmpty() ? null : digitos;
    }

    private static String nome(Map<UUID, String> nomes, UUID id) {
        return id == null ? null : nomes.get(id);
    }

    /** Fora da visão de plataforma, só sai o id de quem tem nome visível daqui (o superadmin não tem). */
    private static UUID visivel(Map<UUID, String> nomes, UUID id, boolean plataforma) {
        return plataforma || id == null || nomes.containsKey(id) ? id : null;
    }
}
