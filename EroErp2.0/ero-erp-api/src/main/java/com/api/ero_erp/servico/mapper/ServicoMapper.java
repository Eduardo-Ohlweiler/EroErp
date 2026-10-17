package com.api.ero_erp.servico.mapper;

import com.api.ero_erp.filial.entity.Filial;
import com.api.ero_erp.servico.dtos.ServicoFilialResponseDto;
import com.api.ero_erp.servico.dtos.ServicoResponseDto;
import com.api.ero_erp.servico.dtos.ServicoSelectDto;
import com.api.ero_erp.servico.entity.Servico;
import com.api.ero_erp.servico.entity.ServicoFilial;

import java.text.Collator;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

public final class ServicoMapper {

    private static final Collator PT_BR = Collator.getInstance(Locale.of("pt", "BR"));

    private ServicoMapper() {}

    public static ServicoResponseDto toResponse(Servico servico) {
        List<ServicoFilialResponseDto> filiais = servico.getFiliais().stream()
                .map(ServicoMapper::toFilial)
                .sorted(Comparator.comparing(ServicoFilialResponseDto::filialNome, PT_BR))
                .toList();
        return new ServicoResponseDto(
                servico.getId(),
                servico.getCodigo(),
                servico.getNome(),
                servico.getObservacao(),
                servico.getAtivo(),
                filiais,
                servico.getCreatedAt(),
                servico.getUpdatedAt());
    }

    public static ServicoSelectDto toSelect(Servico servico) {
        return new ServicoSelectDto(servico.getId(), servico.getCodigo(), servico.getNome());
    }

    private static ServicoFilialResponseDto toFilial(ServicoFilial linha) {
        Filial filial = linha.getFilial();
        return new ServicoFilialResponseDto(
                filial.getId(),
                filial.getPessoa().getNome(),
                filial.getCor(),
                filial.getAtivo(),
                linha.getValor());
    }
}
