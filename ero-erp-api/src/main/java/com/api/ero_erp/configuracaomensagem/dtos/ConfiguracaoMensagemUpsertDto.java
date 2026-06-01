package com.api.ero_erp.configuracaomensagem.dtos;

public record ConfiguracaoMensagemUpsertDto(
        String cabecalhoAgendamento,
        String rodapeAgendamento,
        String cabecalhoLembrete,
        String rodapeLembrete,
        String cabecalhoCancelamento,
        String rodapeCancelamento,
        String cabecalhoConclusao,
        String rodapeConclusao
) {}
