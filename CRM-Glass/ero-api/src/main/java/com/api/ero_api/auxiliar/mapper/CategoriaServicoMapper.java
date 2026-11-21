package com.api.ero_api.auxiliar.mapper;

import com.api.ero_api.auxiliar.dtos.CategoriaServicoCreateDto;
import com.api.ero_api.auxiliar.dtos.CategoriaServicoResponseDto;
import com.api.ero_api.auxiliar.dtos.CategoriaServicoSelectDto;
import com.api.ero_api.auxiliar.dtos.CategoriaServicoUpdateDto;
import com.api.ero_api.auxiliar.entity.CategoriaServico;
import com.api.ero_api.compartilhado.util.TextoBusca;
import java.util.Map;
import java.util.UUID;

/**
 * Conversão entidade ↔ DTO, à mão e sem regra de negócio. O código nunca vem do DTO:
 * o service pede o próximo no salvar. Sem itens do sistema: {@code sistema} sai sempre
 * {@code false} e {@code chave}, sempre nula.
 */
public final class CategoriaServicoMapper {

    private CategoriaServicoMapper() {
    }

    /**
     * {@code nomes}: quem cadastrou e quem alterou, já resolvidos pelo service (uma
     * consulta por página). Dentro de um contratante o superadmin não está no mapa: o id
     * dele não sai e o nome fica vazio (mesma regra do {@code UsuarioMapper}).
     */
    public static CategoriaServicoResponseDto toResponseDto(CategoriaServico t, Map<UUID, String> nomes,
                                                            boolean plataforma) {
        return new CategoriaServicoResponseDto(
                t.getId(),
                t.getCodCategoriaServico(),
                t.getNome(),
                false,
                t.isAtivo(),
                t.getCreatedAt(),
                t.getUpdatedAt(),
                visivel(nomes, t.getCreatedBy(), plataforma),
                visivel(nomes, t.getUpdatedBy(), plataforma),
                nome(nomes, t.getCreatedBy()),
                nome(nomes, t.getUpdatedBy()),
                t.getVersion());
    }

    public static CategoriaServicoSelectDto toSelectDto(CategoriaServico t) {
        return new CategoriaServicoSelectDto(t.getId(), t.getNome(), null, t.isAtivo());
    }

    public static CategoriaServico toEntity(CategoriaServicoCreateDto dto) {
        CategoriaServico t = new CategoriaServico();
        definirNome(t, dto.nome());
        t.setAtivo(true);
        return t;
    }

    /** Só o nome muda; o código nunca. */
    public static void atualizarEntidade(CategoriaServico t, CategoriaServicoUpdateDto dto) {
        definirNome(t, dto.nome());
    }

    private static void definirNome(CategoriaServico t, String nome) {
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
