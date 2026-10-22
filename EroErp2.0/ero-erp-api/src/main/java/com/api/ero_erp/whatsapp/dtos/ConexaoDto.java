package com.api.ero_erp.whatsapp.dtos;

import com.api.ero_erp.whatsapp.enums.StatusConexao;

import java.time.Instant;
import java.util.UUID;

/**
 * Uma linha da tela de WhatsApp: a conexão do tenant ou a de uma filial.
 *
 * <p>Dois formatos, e o mapper escolhe pela role: {@link ConexaoResponseDto}
 * para quem tem a permissão, {@link ConexaoAdminResponseDto} para o
 * superadmin, com a instância e a sobrescrita. Nenhum leva a apikey.
 *
 * <p>Linha sem conexão gravada ainda (nunca conectada) vem com {@code id}
 * nulo e {@code DESCONECTADO}.
 */
public sealed interface ConexaoDto permits ConexaoResponseDto, ConexaoAdminResponseDto {

    UUID id();

    /** Nula = o tenant inteiro. */
    UUID filialId();

    StatusConexao status();

    Instant statusEm();
}
