package com.api.ero_erp.whatsapp.dtos;

import com.api.ero_erp.whatsapp.enums.StatusConexao;

import java.time.Instant;
import java.util.UUID;

/**
 * Para quem tem a permissão WhatsApp: o que é preciso para conectar e
 * desconectar, e nada do servidor.
 *
 * @param numero só dígitos, com DDI; o último que esteve conectado
 */
public record ConexaoResponseDto(
        UUID id,
        UUID filialId,
        String filialNome,
        String filialCor,
        StatusConexao status,
        Instant statusEm,
        String numero,
        Boolean ativo
) implements ConexaoDto {}
