package com.api.ero_erp.auxiliarproduto.mapper;

import com.api.ero_erp.auxiliarproduto.dtos.AuxiliarResponseDto;
import com.api.ero_erp.auxiliarproduto.dtos.AuxiliarSelectDto;
import com.api.ero_erp.auxiliarproduto.dtos.SubgrupoResponseDto;
import com.api.ero_erp.auxiliarproduto.dtos.SubgrupoSelectDto;
import com.api.ero_erp.auxiliarproduto.entity.AuxiliarProdutoEntity;
import com.api.ero_erp.auxiliarproduto.entity.GrupoProduto;
import com.api.ero_erp.auxiliarproduto.entity.SubgrupoProduto;

public final class AuxiliarProdutoMapper {

    private AuxiliarProdutoMapper() {}

    public static AuxiliarResponseDto toResponse(AuxiliarProdutoEntity a) {
        return new AuxiliarResponseDto(a.getId(), a.getNome(), a.getAtivo(), a.getCreatedAt(), a.getUpdatedAt());
    }

    public static AuxiliarSelectDto toSelect(AuxiliarProdutoEntity a) {
        return new AuxiliarSelectDto(a.getId(), a.getNome());
    }

    public static SubgrupoResponseDto toResponse(SubgrupoProduto s) {
        GrupoProduto grupo = s.getGrupo();
        return new SubgrupoResponseDto(
                s.getId(),
                grupo.getId(),
                grupo.getNome(),
                grupo.getAtivo(),
                s.getNome(),
                s.getAtivo(),
                s.getCreatedAt(),
                s.getUpdatedAt());
    }

    public static SubgrupoSelectDto toSelect(SubgrupoProduto s) {
        return new SubgrupoSelectDto(s.getId(), s.getNome(), s.getGrupo().getId(), s.getGrupo().getNome());
    }
}
