package com.api.ero_erp.loginlog.mapper;

import com.api.ero_erp.loginlog.dtos.LoginLogResponseDto;
import com.api.ero_erp.loginlog.entity.LoginLog;
import org.springframework.stereotype.Component;

@Component
public class LoginLogMapper {

    public LoginLogResponseDto toDto(LoginLog log) {
        return new LoginLogResponseDto(
                log.getId(),
                log.getCliente().getId(),
                log.getCliente().getNome(),
                log.getUsuario().getId(),
                log.getUsuario().getNome(),
                log.getDataLogin(),
                log.getDataLogout(),
                log.getTipoLogout() != null ? log.getTipoLogout().name() : null,
                log.getEnderecoIp()
        );
    }
}
