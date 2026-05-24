package com.api.ero_erp.compromisso.mapper;

import com.api.ero_erp.compromisso.dtos.CompromissoCalendarioDto;
import com.api.ero_erp.compromisso.dtos.CompromissoResponseDto;
import com.api.ero_erp.compromisso.entity.Compromisso;

public class CompromissoMapper {

    private CompromissoMapper() {}

    public static CompromissoResponseDto toDto(Compromisso c) {
        return new CompromissoResponseDto(
                c.getId(),
                c.getTitulo(),
                c.getDescricao(),
                c.getCor(),
                c.getInicio(),
                c.getFim(),
                c.getCancelado(),
                c.getConcluido(),
                c.getMotivoCancelamento(),
                c.getRecorrenciaSimNao(),
                c.getTipoRecorrencia(),
                c.getQuantidadeRecorrencia(),
                c.getCompromissoPai()  != null ? c.getCompromissoPai().getId()            : null,

                // emitente
                c.getEmitente()        != null ? c.getEmitente().getId()                  : null,
                c.getEmitente()        != null ? c.getEmitente().getPessoa().getNome()    : null,

                // usuário
                c.getUsuario().getId(),
                c.getUsuario().getNome(),

                // pessoa
                c.getPessoa()          != null ? c.getPessoa().getId()                    : null,
                c.getPessoa()          != null ? c.getPessoa().getNome()                  : null,

                // auditoria
                c.getCreatedAt(),
                c.getCreatedBy()       != null ? c.getCreatedBy().getId()                 : null,
                c.getCreatedBy()       != null ? c.getCreatedBy().getNome()               : null,
                c.getUpdatedAt(),
                c.getUpdatedBy()       != null ? c.getUpdatedBy().getId()                 : null,
                c.getUpdatedBy()       != null ? c.getUpdatedBy().getNome()               : null
        );
    }

    public static CompromissoCalendarioDto toCalendarioDto(Compromisso c) {
        return new CompromissoCalendarioDto(
                c.getId(),
                c.getTitulo(),
                c.getCor(),
                c.getInicio(),
                c.getFim(),
                c.getCancelado(),
                c.getConcluido(),
                c.getEmitente()  != null ? c.getEmitente().getId()              : null,
                c.getEmitente()  != null ? c.getEmitente().getPessoa().getNome() : null,
                c.getPessoa()    != null ? c.getPessoa().getNome()               : null,
                c.getTipoRecorrencia(),
                c.getCompromissoPai() != null ? c.getCompromissoPai().getId()   : null
        );
    }
}