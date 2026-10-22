package com.api.ero_erp.whatsapp.dtos;

import com.api.ero_erp.whatsapp.enums.StatusConexao;

import java.time.Instant;
import java.util.UUID;

/**
 * Para o superadmin: a linha de {@link ConexaoResponseDto} mais a instância e
 * a sobrescrita do servidor. A apikey continua de fora — só se há uma.
 *
 * @param url a sobrescrita; nula = o servidor global
 */
public record ConexaoAdminResponseDto(
        UUID id,
        UUID filialId,
        String filialNome,
        String filialCor,
        StatusConexao status,
        Instant statusEm,
        String numero,
        Boolean ativo,
        String instancia,
        String url,
        boolean possuiApiKey
) implements ConexaoDto {}
