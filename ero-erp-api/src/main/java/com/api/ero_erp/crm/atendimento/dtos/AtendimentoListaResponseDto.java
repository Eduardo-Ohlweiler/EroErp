package com.api.ero_erp.crm.atendimento.dtos;

import java.time.LocalDateTime;

/**
 * Projeção usada na tela de listagem completa de atendimentos do CRM.
 * Espelha os campos de {@link AtendimentoResponseDto} e acrescenta os dados
 * da última assunção (transferência de responsabilidade), quando houver.
 */
public record AtendimentoListaResponseDto(
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
        LocalDateTime dataConclusao,
        Boolean       ativo,
        Integer       mensagensNaoLidas,
        Long          assumidoPorId,
        String        assumidoPorNome,
        LocalDateTime dataAssuncao
) {}
