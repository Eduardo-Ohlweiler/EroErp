package com.api.ero_erp.crm.atendimento.mapper;

import com.api.ero_erp.crm.atendimento.dtos.AtendimentoResponseDto;
import com.api.ero_erp.crm.atendimento.entity.Atendimento;

public class AtendimentoMapper {

    private AtendimentoMapper() {}

    public static AtendimentoResponseDto toDto(Atendimento a) {
        return new AtendimentoResponseDto(
                a.getId(),
                a.getNumero(),
                a.getContatoNome(),
                a.getPessoa()    != null ? a.getPessoa().getId()      : null,
                a.getPessoa()    != null ? a.getPessoa().getNome()    : null,
                a.getAndamento() != null ? a.getAndamento().getId()   : null,
                a.getAndamento() != null ? a.getAndamento().getNome() : null,
                a.getAndamento() != null ? a.getAndamento().getCor()  : null,
                a.getUsuario()   != null ? a.getUsuario().getId()     : null,
                a.getUsuario()   != null ? a.getUsuario().getNome()   : null,
                a.getAssunto(),
                a.getDataAbertura(),
                a.getDataUltimaMensagem(),
                a.getDataUltimaMensagemCliente(),
                a.getDataConclusao(),
                a.getAtivo()
        );
    }
}
