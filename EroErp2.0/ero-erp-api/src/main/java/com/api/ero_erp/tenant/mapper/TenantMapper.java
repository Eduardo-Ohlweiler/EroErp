package com.api.ero_erp.tenant.mapper;

import com.api.ero_erp.tenant.dtos.TenantResponseDto;
import com.api.ero_erp.tenant.dtos.TenantSelectDto;
import com.api.ero_erp.tenant.entity.Tenant;

import java.time.Duration;
import java.time.Instant;

public final class TenantMapper {

    private TenantMapper() {}

    public static TenantResponseDto toResponse(Tenant tenant) {
        return new TenantResponseDto(
                tenant.getId(),
                tenant.getNome(),
                tenant.getAtivo(),
                tenant.getPeriodoAcesso(),
                tenant.getAcessoExpiraEm(),
                tenant.acessoExpirado(),
                diasParaExpirar(tenant),
                tenant.getPaleta(),
                tenant.getCreatedAt());
    }

    public static TenantSelectDto toSelect(Tenant tenant) {
        return new TenantSelectDto(tenant.getId(), tenant.getNome());
    }

    /**
     * Calculado aqui, e não no front: a conta depende do fuso em que o prazo
     * foi gravado, e duas implementações divergiriam na virada do dia.
     */
    private static Long diasParaExpirar(Tenant tenant) {
        Instant expira = tenant.getAcessoExpiraEm();
        return expira == null ? null : Duration.between(Instant.now(), expira).toDays();
    }
}
