package com.api.ero_erp.compromisso.mapper;

import com.api.ero_erp.compromisso.dtos.CompromissoCalendarioDto;
import com.api.ero_erp.compromisso.dtos.CompromissoResponseDto;
import com.api.ero_erp.compromisso.dtos.ConvidadoDto;
import com.api.ero_erp.compromisso.entity.Compromisso;
import com.api.ero_erp.usuario.entity.Usuario;

import java.text.Collator;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

public final class CompromissoMapper {

    private static final Collator COLLATOR = Collator.getInstance(Locale.of("pt", "BR"));

    private CompromissoMapper() {}

    public static CompromissoResponseDto toResponse(Compromisso c) {
        Usuario criador = c.getCreatedBy();
        return new CompromissoResponseDto(
                c.getId(),
                c.getFilial().getId(),
                c.getFilial().getPessoa().getNome(),
                c.getResponsavel().getId(),
                c.getResponsavel().getNome(),
                c.getPessoa() != null ? c.getPessoa().getId() : null,
                c.getPessoa() != null ? c.getPessoa().getNome() : null,
                c.getTitulo(),
                c.getDescricao(),
                c.getCor(),
                c.corExibicao(),
                c.getInicio(),
                c.getFim(),
                c.getStatus(),
                c.getMotivoCancelamento(),
                c.getSerieId(),
                c.getTipoRecorrencia(),
                c.getConsultaId(),
                convidados(c),
                criador != null ? criador.getNome() : null,
                c.getCreatedAt(),
                c.getUpdatedAt());
    }

    public static CompromissoCalendarioDto toCalendario(Compromisso c) {
        return new CompromissoCalendarioDto(
                c.getId(),
                c.getTitulo(),
                c.getInicio(),
                c.getFim(),
                c.getStatus(),
                c.corExibicao(),
                c.getFilial().getId(),
                c.getFilial().getPessoa().getNome(),
                c.getResponsavel().getId(),
                c.getResponsavel().getNome(),
                c.getPessoa() != null ? c.getPessoa().getNome() : null,
                c.getConvidados().stream().map(cv -> cv.getUsuario().getId()).toList(),
                c.getSerieId() != null,
                c.getConsultaId());
    }

    /** Em ordem de nome: o conjunto não tem ordem, e a tela não deve embaralhar. */
    private static List<ConvidadoDto> convidados(Compromisso c) {
        return c.getConvidados().stream()
                .map(cv -> new ConvidadoDto(cv.getUsuario().getId(), cv.getUsuario().getNome()))
                .sorted(Comparator.comparing(ConvidadoDto::nome, COLLATOR))
                .toList();
    }
}
