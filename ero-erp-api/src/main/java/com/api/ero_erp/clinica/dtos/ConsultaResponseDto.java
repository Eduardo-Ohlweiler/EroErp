package com.api.ero_erp.clinica.dtos;

import com.api.ero_erp.clinica.enums.StatusConsulta;

import java.time.LocalDateTime;
import java.util.List;

public record ConsultaResponseDto(
        Long                          id,
        StatusConsulta                status,

        // Emitente
        Long                          emitenteId,
        String                        emitenteNome,
        String                        emitenteDocumento,

        // Pessoa / paciente
        Long                          pessoaId,
        String                        pessoaNome,
        String                        pessoaDocumento,

        // Compromisso vinculado
        Long                          compromissoId,

        java.time.LocalDateTime       inicio,
        java.time.LocalDateTime       fim,

        String                        observacao,
        String                        motivoCancelamento,

        // Faturamento
        boolean                       faturado,
        Long                          contaReceberId,

        // Reconsulta
        Long                          consultaPaiId,

        // Sublistas
        List<ConsultaServicoResponseDto>  servicos,
        List<ConsultaProdutoResponseDto>  produtos,

        // Ajuste global
        String                        tipoAjusteGeral,
        String                        tipoCalculoGeral,
        java.math.BigDecimal          valorAjusteGeral,

        // Auditoria
        LocalDateTime                 createdAt,
        String                        createdByNome,
        LocalDateTime                 updatedAt,
        String                        updatedByNome,

        // Ficha de anamnese vinculada
        Long                          fichaAnamneseId,
        String                        fichaAnamneseDescricao
) {}
