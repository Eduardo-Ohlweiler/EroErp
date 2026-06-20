package com.api.ero_erp.loginlog.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.loginlog.dtos.LoginLogResponseDto;
import com.api.ero_erp.loginlog.entity.LoginLog;
import com.api.ero_erp.loginlog.entity.TipoLogout;
import com.api.ero_erp.loginlog.mapper.LoginLogMapper;
import com.api.ero_erp.loginlog.repository.LoginLogRepository;
import com.api.ero_erp.usuario.entity.Usuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Service
public class LoginLogService {

    private final LoginLogRepository loginLogRepository;
    private final LoginLogMapper     loginLogMapper;

    public LoginLogService(
            LoginLogRepository loginLogRepository,
            LoginLogMapper     loginLogMapper
    ) {
        this.loginLogRepository = loginLogRepository;
        this.loginLogMapper     = loginLogMapper;
    }

    @Transactional(readOnly = true)
    public Page<LoginLogResponseDto> getAll(
            Pageable  pageable,
            Long      clienteId,
            Long      usuarioId,
            LocalDate dataInicio,
            LocalDate dataFim
    ) {
        LocalDateTime inicio = dataInicio != null ? dataInicio.atStartOfDay()         : null;
        LocalDateTime fim    = dataFim    != null ? dataFim.atTime(LocalTime.MAX)      : null;

        return loginLogRepository
                .findAllWithFilters(pageable, clienteId, usuarioId, inicio, fim)
                .map(loginLogMapper::toDto);
    }

    /**
     * Registra um novo login (sessão aberta) e devolve o id, usado como claim
     * "sessionId" no JWT para fechar exatamente esta sessão no logout/expiração.
     */
    @Transactional
    public Long registrarLogin(Usuario usuario, String enderecoIp) {
        LoginLog log = new LoginLog();
        log.setCliente(usuario.getCliente());
        log.setUsuario(usuario);
        log.setDataLogin(LocalDateTime.now());
        log.setEnderecoIp(enderecoIp);
        return loginLogRepository.save(log).getId();
    }

    /**
     * Fecha a sessão preenchendo data_logout. Idempotente: só atualiza linhas
     * com data_logout ainda nula, então expirações repetidas viram no-op.
     */
    @Transactional
    public void fecharSessao(Long sessionId, LocalDateTime quando, TipoLogout tipo) {
        if (sessionId == null)
            return;
        loginLogRepository.fecharSessao(sessionId, quando, tipo);
    }
}
