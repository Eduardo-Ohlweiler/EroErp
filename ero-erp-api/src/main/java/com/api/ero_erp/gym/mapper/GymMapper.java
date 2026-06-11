package com.api.ero_erp.gym.mapper;

import com.api.ero_erp.gym.dto.*;
import com.api.ero_erp.gym.entity.Exercicio;
import com.api.ero_erp.gym.entity.ItemPlanoTreino;
import com.api.ero_erp.gym.entity.PlanoTreino;

import java.util.Comparator;
import java.util.List;

public class GymMapper {

    private GymMapper() {}

    public static ExercicioResponseDto toResponseDto(Exercicio e) {
        return new ExercicioResponseDto(
                e.getId(),
                e.getNome(),
                e.getDescricao(),
                e.isAtivo(),
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }

    public static ExercicioSummaryDto toSummaryDto(Exercicio e) {
        return new ExercicioSummaryDto(e.getId(), e.getNome(), e.isAtivo());
    }

    public static PlanoTreinoResponseDto toResponseDto(PlanoTreino p) {
        List<ItemPlanoTreinoResponseDto> itensDto = p.getItens().stream()
                .sorted(Comparator.comparingInt(ItemPlanoTreino::getOrdem))
                .map(GymMapper::toItemDto)
                .toList();

        return new PlanoTreinoResponseDto(
                p.getId(),
                p.getPessoa().getId(),
                p.getPessoa().getNome(),
                p.getEmitente() != null ? p.getEmitente().getId()               : null,
                p.getEmitente() != null ? p.getEmitente().getPessoa().getNome() : null,
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

    public static PlanoTreinoSummaryDto toSummaryDto(PlanoTreino p) {
        return new PlanoTreinoSummaryDto(
                p.getId(),
                p.getPessoa().getId(),
                p.getPessoa().getNome(),
                p.getNome(),
                p.getDataInicio(),
                p.getDataFim(),
                p.isAtivo()
        );
    }

    public static ItemPlanoTreinoResponseDto toItemDto(ItemPlanoTreino i) {
        return new ItemPlanoTreinoResponseDto(
                i.getId(),
                i.getDiaSemana(),
                i.getOrdem(),
                i.getExercicio() != null ? i.getExercicio().getId()   : null,
                i.getExercicio() != null ? i.getExercicio().getNome() : null,
                i.getSeries(),
                i.getRepeticoes(),
                i.getTipoExecucao(),
                i.getPausaSegundos(),
                i.getObservacao()
        );
    }
}
