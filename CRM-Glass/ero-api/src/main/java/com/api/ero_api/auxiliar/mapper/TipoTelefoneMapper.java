package com.api.ero_api.auxiliar.mapper;

import com.api.ero_api.auxiliar.dtos.TipoTelefoneCreateDto;
import com.api.ero_api.auxiliar.dtos.TipoTelefoneResponseDto;
import com.api.ero_api.auxiliar.dtos.TipoTelefoneSelectDto;
import com.api.ero_api.auxiliar.dtos.TipoTelefoneUpdateDto;
import com.api.ero_api.auxiliar.entity.TipoTelefone;
import com.api.ero_api.auxiliar.enums.TipoTelefoneDoSistema;
import com.api.ero_api.compartilhado.util.TextoBusca;
import java.util.Map;
import java.util.UUID;

/**
 * Conversão entidade ↔ DTO, à mão e sem regra de negócio. O código nunca vem do DTO:
 * o service pede o próximo no salvar.
 */
public final class TipoTelefoneMapper {

    private TipoTelefoneMapper() {
    }

    /**
     * {@code nomes}: quem cadastrou e quem alterou, já resolvidos pelo service (uma
     * consulta por página). Dentro de um contratante o superadmin não está no mapa: o id
     * dele não sai e o nome fica vazio (mesma regra do {@code UsuarioMapper}).
     */
    public static TipoTelefoneResponseDto toResponseDto(TipoTelefone t, Map<UUID, String> nomes, boolean plataforma) {
        return new TipoTelefoneResponseDto(
                t.getId(),
                t.getCodTipoTelefone(),
                t.getNome(),
                t.sistema(),
                t.isAtivo(),
                t.getCreatedAt(),
                t.getUpdatedAt(),
                visivel(nomes, t.getCreatedBy(), plataforma),
                visivel(nomes, t.getUpdatedBy(), plataforma),
                nome(nomes, t.getCreatedBy()),
                nome(nomes, t.getUpdatedBy()),
                t.getVersion());
    }

    public static TipoTelefoneSelectDto toSelectDto(TipoTelefone t) {
        return new TipoTelefoneSelectDto(t.getId(), t.getNome(), t.getChave(), t.isAtivo());
    }

    /** Item do contratante: sem chave e ativo. */
    public static TipoTelefone toEntity(TipoTelefoneCreateDto dto) {
        TipoTelefone t = new TipoTelefone();
        definirNome(t, dto.nome());
        t.setChave(null);
        t.setAtivo(true);
        return t;
    }

    /** Só o nome muda; código e chave nunca. */
    public static void atualizarEntidade(TipoTelefone t, TipoTelefoneUpdateDto dto) {
        definirNome(t, dto.nome());
    }

    /**
     * Item do sistema de um contratante novo (fluxo de plataforma, em ROOT): o tenant é
     * atribuído explicitamente e o código vem do enum, nunca do maior + 1.
     */
    public static TipoTelefone doSistema(TipoTelefoneDoSistema item, UUID tenantId) {
        TipoTelefone t = new TipoTelefone();
        t.atribuirTenant(tenantId);
        t.setCodTipoTelefone(item.codigo());
        t.setChave(item.name());
        definirNome(t, item.rotulo());
        t.setAtivo(true);
        return t;
    }

    private static void definirNome(TipoTelefone t, String nome) {
        t.setNome(nome.trim());
        t.setNomeBusca(TextoBusca.normalizar(nome));
    }

    private static String nome(Map<UUID, String> nomes, UUID id) {
        return id == null ? null : nomes.get(id);
    }

    /** Fora da visão de plataforma, só sai o id de quem tem nome visível daqui (o superadmin não tem). */
    private static UUID visivel(Map<UUID, String> nomes, UUID id, boolean plataforma) {
        return plataforma || id == null || nomes.containsKey(id) ? id : null;
    }
}
