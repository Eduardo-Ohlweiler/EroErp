package com.api.ero_erp.crm.atendimento.mapper;

import com.api.ero_erp.crm.atendimento.dtos.AtendimentoListaResponseDto;
import com.api.ero_erp.crm.atendimento.dtos.AtendimentoResponseDto;
import com.api.ero_erp.crm.atendimento.entity.Atendimento;
import com.api.ero_erp.crm.atendimento.entity.AtendimentoAssuncao;

public class AtendimentoMapper {

    private AtendimentoMapper() {}

    /**
     * Monta o DTO da tela de listagem. {@code ultimaAssuncao} pode ser {@code null}
     * (atendimento nunca foi transferido) — nesse caso os campos de assunção ficam nulos.
     */
    public static AtendimentoListaResponseDto toListaDto(Atendimento a, AtendimentoAssuncao ultimaAssuncao) {
        return new AtendimentoListaResponseDto(
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
                a.getDataConclusao(),
                a.getAtivo(),
                a.getMensagensNaoLidas(),
                ultimaAssuncao != null ? ultimaAssuncao.getUsuario().getId()   : null,
                ultimaAssuncao != null ? ultimaAssuncao.getUsuario().getNome() : null,
                ultimaAssuncao != null ? ultimaAssuncao.getData()              : null
        );
    }

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
                a.getAtivo(),
                a.getMensagensNaoLidas()
        );
    }
}
