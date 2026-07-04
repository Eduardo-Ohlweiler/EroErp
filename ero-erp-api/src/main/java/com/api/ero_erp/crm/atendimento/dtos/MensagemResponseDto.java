package com.api.ero_erp.crm.atendimento.dtos;

import java.time.LocalDateTime;

public record MensagemResponseDto(
        Long          id,
        Long          atendimentoId,
        String        direcao,
        String        tipo,
        String        conteudo,
        String        midiaMimetype,
        String        midiaNome,
        Long          usuarioId,
        String        usuarioNome,
        String        evolutionMessageId,
        String        status,
        LocalDateTime dataMensagem
) {}
