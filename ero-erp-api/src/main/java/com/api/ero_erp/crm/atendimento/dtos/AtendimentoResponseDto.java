package com.api.ero_erp.crm.atendimento.dtos;

import java.time.LocalDateTime;

public record AtendimentoResponseDto(
        Long          id,
        String        numero,
        String        contatoNome,
        Long          pessoaId,
        String        pessoaNome,
        Long          andamentoId,
        String        andamentoNome,
        String        andamentoCor,
        Long          usuarioId,
        String        usuarioNome,
        String        assunto,
        LocalDateTime dataAbertura,
        LocalDateTime dataUltimaMensagem,
        LocalDateTime dataUltimaMensagemCliente,
        LocalDateTime dataConclusao,
        Boolean       ativo
) {}
