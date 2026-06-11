package com.api.ero_erp.clinica.mapper;

import com.api.ero_erp.clinica.dto.ItemPlanoAlimentarResponseDto;
import com.api.ero_erp.clinica.dto.PlanoAlimentarResponseDto;
import com.api.ero_erp.clinica.dto.PlanoAlimentarSummaryDto;
import com.api.ero_erp.clinica.entity.ItemPlanoAlimentar;
import com.api.ero_erp.clinica.entity.PlanoAlimentar;

import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;

public class PlanoAlimentarMapper {

    private static final DateTimeFormatter HORARIO_FMT = DateTimeFormatter.ofPattern("HH:mm");

    private PlanoAlimentarMapper() {}

    public static PlanoAlimentarResponseDto toResponseDto(PlanoAlimentar p) {
        List<ItemPlanoAlimentarResponseDto> itensDto = p.getItens().stream()
                .sorted(Comparator.comparing(ItemPlanoAlimentar::getHorario))
                .map(PlanoAlimentarMapper::toItemDto)
                .toList();

        return new PlanoAlimentarResponseDto(
                p.getId(),
                p.getPessoa().getId(),
                p.getPessoa().getNome(),
                p.getEmitente() != null ? p.getEmitente().getId()                 : null,
                p.getEmitente() != null ? p.getEmitente().getPessoa().getNome()   : null,
                p.getNome(),
                p.getDataInicio(),
                p.getDataFim(),
                p.getObservacao(),
                p.isAtivo(),
                itensDto,
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }

    public static PlanoAlimentarSummaryDto toSummaryDto(PlanoAlimentar p) {
        return new PlanoAlimentarSummaryDto(
                p.getId(),
                p.getPessoa().getId(),
                p.getPessoa().getNome(),
                p.getNome(),
                p.getDataInicio(),
                p.getDataFim(),
                p.isAtivo()
        );
    }

    public static ItemPlanoAlimentarResponseDto toItemDto(ItemPlanoAlimentar i) {
        return new ItemPlanoAlimentarResponseDto(
                i.getId(),
                i.getDiaSemana(),
                i.getHorario().format(HORARIO_FMT),
                i.getRefeicao() != null ? i.getRefeicao().getId()   : null,
                i.getRefeicao() != null ? i.getRefeicao().getNome() : null,
                i.getQuantidade(),
                i.getPeso(),
                i.getObservacao()
        );
    }
}
