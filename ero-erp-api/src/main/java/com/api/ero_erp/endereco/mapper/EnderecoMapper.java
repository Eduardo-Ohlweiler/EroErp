package com.api.ero_erp.endereco.mapper;

import com.api.ero_erp.endereco.dtos.EnderecoResponseDto;
import com.api.ero_erp.endereco.entity.Endereco;
import java.util.List;
import java.util.stream.Collectors;

public class EnderecoMapper {

    public static EnderecoResponseDto toDto(Endereco e) {
        if (e == null) return null;

        return new EnderecoResponseDto(
                e.getId(),
                e.getPessoa()       != null ? e.getPessoa().getId()               : null,
                e.getTipoEndereco() != null ? e.getTipoEndereco().getId()         : null,
                e.getTipoEndereco() != null ? e.getTipoEndereco().getNome()       : null,
                e.getCidade()       != null ? e.getCidade().getId()               : null,
                e.getCidade()       != null ? e.getCidade().getNome()             : null,
                e.getCidade()       != null && e.getCidade().getEstado() != null
                        ? e.getCidade().getEstado().getId()   : null,
                e.getCidade()       != null && e.getCidade().getEstado() != null
                        ? e.getCidade().getEstado().getNome() : null,
                e.getCidade()       != null && e.getCidade().getEstado() != null
                        ? e.getCidade().getEstado().getSigla() : null,
                e.getCep(),
                e.getRua(),
                e.getNumero(),
                e.getBairro(),
                e.getComplemento(),
                e.getPrincipal(),
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }

    public static List<EnderecoResponseDto> toDtoList(List<Endereco> entities) {
        if (entities == null) return List.of();
        return entities.stream()
                .map(EnderecoMapper::toDto)
                .collect(Collectors.toList());
    }
}