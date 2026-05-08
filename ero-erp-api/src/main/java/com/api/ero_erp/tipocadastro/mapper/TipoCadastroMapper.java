package com.api.ero_erp.tipocadastro.mapper;

import com.api.ero_erp.tipocadastro.dtos.TipoCadastroResponseDto;
import com.api.ero_erp.tipocadastro.entity.TipoCadastro;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public class TipoCadastroMapper {

    private TipoCadastroMapper() {}

    public static TipoCadastroResponseDto toDto(TipoCadastro tipo) {
        return new TipoCadastroResponseDto(
                tipo.getId(),
                tipo.getNome(),
                tipo.getAtivo()
        );
    }

    public static Set<TipoCadastroResponseDto> toDtoSet(Set<TipoCadastro> tipos) {
        if (tipos == null) return Set.of();
        return tipos.stream()
                .map(TipoCadastroMapper::toDto)
                .collect(Collectors.toSet());
    }

    public static List<TipoCadastroResponseDto> toDtoList(List<TipoCadastro> tipos) {
        return tipos.stream().map(TipoCadastroMapper::toDto).toList();
    }
}