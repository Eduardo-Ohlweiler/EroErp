package com.api.ero_erp.otorrino.mapper;

import com.api.ero_erp.otorrino.dto.AudiometriaLimiarResponseDto;
import com.api.ero_erp.otorrino.dto.AudiometriaResponseDto;
import com.api.ero_erp.otorrino.dto.AudiometriaSummaryDto;
import com.api.ero_erp.otorrino.entity.Audiometria;
import com.api.ero_erp.otorrino.entity.AudiometriaLimiar;

import java.util.List;

/** Mapper utilitário (estático) para a entidade Audiometria. */
public final class AudiometriaMapper {

    private AudiometriaMapper() {
    }

    public static AudiometriaResponseDto toResponseDto(Audiometria a) {
        return new AudiometriaResponseDto(
                a.getId(),
                a.getPessoa().getId(),
                a.getPessoa().getNome(),
                a.getUsuario() != null ? a.getUsuario().getId() : null,
                a.getUsuario() != null ? a.getUsuario().getNome() : null,
                a.getConsulta() != null ? a.getConsulta().getId() : null,
                a.getDataExame(),
                a.getSrtOdDb(),
                a.getSrtOeDb(),
                a.getIrfOdPerc(),
                a.getIrfOePerc(),
                a.getMediaOd(),
                a.getMediaOe(),
                a.getGrauOd() != null ? a.getGrauOd().name() : null,
                a.getGrauOe() != null ? a.getGrauOe().name() : null,
                a.getTipoPerdaOd() != null ? a.getTipoPerdaOd().name() : null,
                a.getTipoPerdaOe() != null ? a.getTipoPerdaOe().name() : null,
                a.getNorma(),
                a.getObservacao(),
                toLimiarDtos(a.getLimiares()),
                a.getCreatedAt(),
                a.getUpdatedAt()
        );
    }

    public static AudiometriaSummaryDto toSummaryDto(Audiometria a) {
        return new AudiometriaSummaryDto(
                a.getId(),
                a.getPessoa().getId(),
                a.getPessoa().getNome(),
                a.getDataExame(),
                a.getGrauOd() != null ? a.getGrauOd().name() : null,
                a.getGrauOe() != null ? a.getGrauOe().name() : null
        );
    }

    public static List<AudiometriaLimiarResponseDto> toLimiarDtos(List<AudiometriaLimiar> limiares) {
        if (limiares == null) return List.of();
        return limiares.stream()
                .map(AudiometriaMapper::toLimiarDto)
                .toList();
    }

    public static AudiometriaLimiarResponseDto toLimiarDto(AudiometriaLimiar l) {
        return new AudiometriaLimiarResponseDto(
                l.getId(),
                l.getOrelha(),
                l.getVia(),
                l.getFrequencia(),
                l.getLimiarDb(),
                l.isMascarado(),
                l.isSemResposta()
        );
    }
}
