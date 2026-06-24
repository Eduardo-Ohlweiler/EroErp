package com.api.ero_erp.clinica.dtos;

import com.api.ero_erp.clinica.enums.StatusPacote;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record PacoteContratadoResponseDto(
        Long          id,
        String        nome,
        StatusPacote  status,

        // Emitente
        Long          emitenteId,
        String        emitenteNome,

        // Pessoa / paciente
        Long          pessoaId,
        String        pessoaNome,
        String        pessoaDocumento,

        // Serviço
        Long          produtoId,
        String        produtoNome,

        Integer       quantidadeSessoes,
        BigDecimal    valorTotal,

        // Faturamento (conta a receber pré-paga única)
        Long          contaReceberId,

        String        observacao,
        String        motivoCancelamento,

        // Anexos opcionais do pacote
        Long          documentoId,
        String        documentoNumero,
        Long          fichaAnamneseId,
        String        fichaAnamneseNome,

        // Resumo de sessões
        int           sessoesUsadas,
        int           sessoesRestantes,
        List<SessaoResumoDto> sessoes,

        LocalDateTime createdAt
) {}
