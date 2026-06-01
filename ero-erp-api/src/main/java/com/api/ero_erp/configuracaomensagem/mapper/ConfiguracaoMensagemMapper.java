package com.api.ero_erp.configuracaomensagem.mapper;

import com.api.ero_erp.configuracaomensagem.dtos.ConfiguracaoMensagemResponseDto;
import com.api.ero_erp.configuracaomensagem.entity.ConfiguracaoMensagem;

public class ConfiguracaoMensagemMapper {

    private ConfiguracaoMensagemMapper() {}

    public static ConfiguracaoMensagemResponseDto toDto(ConfiguracaoMensagem entity) {
        return new ConfiguracaoMensagemResponseDto(
                entity.getId(),
                entity.getUsuario().getId(),
                entity.getUsuario().getNome(),
                entity.getCabecalhoAgendamento(),
                entity.getRodapeAgendamento(),
                entity.getCabecalhoLembrete(),
                entity.getRodapeLembrete(),
                entity.getCabecalhoCancelamento(),
                entity.getRodapeCancelamento(),
                entity.getCabecalhoConclusao(),
                entity.getRodapeConclusao()
        );
    }
}
