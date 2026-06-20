package com.api.ero_erp.loginlog.controller;

import com.api.ero_erp.loginlog.dtos.LoginLogResponseDto;
import com.api.ero_erp.loginlog.service.LoginLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/login-logs")
@Tag(name = "Login Logs", description = "Auditoria de logins e logouts (somente SUPERADMIN)")
public class LoginLogController {

    private final LoginLogService loginLogService;

    public LoginLogController(LoginLogService loginLogService) {
        this.loginLogService = loginLogService;
    }

    @Operation(summary = "Listar logs de login/logout",
            description = "Retorna lista paginada de todos os clientes; filtros opcionais por cliente, usuário e período")
    @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso")
    @GetMapping
    @PreAuthorize("hasRole('SUPERADMIN')")
    public Page<LoginLogResponseDto> getAll(

            @Parameter(description = "Paginação e ordenação")
            @PageableDefault(size = 20, sort = "dataLogin", direction = org.springframework.data.domain.Sort.Direction.DESC)
            Pageable pageable,

            @Parameter(description = "Filtro por cliente")
            @RequestParam(required = false) Long clienteId,

            @Parameter(description = "Filtro por usuário")
            @RequestParam(required = false) Long usuarioId,

            @Parameter(description = "Filtro por data inicial (login)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,

            @Parameter(description = "Filtro por data final (login)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim
    ) {
        return loginLogService.getAll(pageable, clienteId, usuarioId, dataInicio, dataFim);
    }
}
