package com.api.ero_erp.crm.atendimento.mapper;

import com.api.ero_erp.crm.atendimento.dtos.MensagemResponseDto;
import com.api.ero_erp.crm.atendimento.entity.Mensagem;

public class MensagemMapper {

    private MensagemMapper() {}

    public static MensagemResponseDto toDto(Mensagem m) {
        return new MensagemResponseDto(
                m.getId(),
                m.getAtendimento() != null ? m.getAtendimento().getId() : null,
                m.getDirecao() != null ? m.getDirecao().name() : null,
                m.getTipo()    != null ? m.getTipo().name()    : null,
                m.getConteudo(),
                m.getMidiaMimetype(),
                m.getMidiaNome(),
                m.getUsuario() != null ? m.getUsuario().getId()   : null,
                m.getUsuario() != null ? m.getUsuario().getNome() : null,
                m.getEvolutionMessageId(),
                m.getStatus(),
                m.getDataMensagem()
        );
    }
}
