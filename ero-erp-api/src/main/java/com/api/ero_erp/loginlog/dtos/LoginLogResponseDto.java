package com.api.ero_erp.loginlog.dtos;

import java.time.LocalDateTime;

public record LoginLogResponseDto(
        Long          id,
        Long          clienteId,
        String        clienteNome,
        Long          usuarioId,
        String        usuarioNome,
        LocalDateTime dataLogin,
        LocalDateTime dataLogout,
        String        tipoLogout,
        String        enderecoIp
) {}
