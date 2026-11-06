package com.api.ero_api.tenant.mapper;

import com.api.ero_api.tenant.dtos.TenantAtualDto;
import com.api.ero_api.tenant.dtos.TenantCreateDto;
import com.api.ero_api.tenant.dtos.TenantResponseDto;
import com.api.ero_api.tenant.dtos.TenantSelectDto;
import com.api.ero_api.tenant.dtos.TenantUpdateDto;
import com.api.ero_api.tenant.entity.Tenant;
import com.api.ero_api.tenant.util.DocumentoValidator;
import java.util.Locale;

public final class TenantMapper {

    private TenantMapper() {
    }

    public static TenantResponseDto toResponseDto(Tenant t) {
        return new TenantResponseDto(
                t.getId(),
                t.getNome(),
                t.getDocumento(),
                t.getEmail(),
                t.isAtivo(),
                t.isExige2fa(),
                t.getCorDestaque(),
                t.getCreatedAt(),
                t.getUpdatedAt(),
                t.getCreatedBy(),
                t.getUpdatedBy(),
                t.getVersion());
    }

    public static TenantSelectDto toSelectDto(Tenant t) {
        return new TenantSelectDto(t.getId(), t.getNome());
    }

    public static TenantAtualDto toAtualDto(Tenant t) {
        return new TenantAtualDto(t.getId(), t.getNome(), t.getCorDestaque(), t.isExige2fa());
    }

    public static Tenant toEntity(TenantCreateDto dto) {
        Tenant t = new Tenant();
        t.setNome(dto.nome().trim());
        t.setDocumento(DocumentoValidator.normalizar(dto.documento()));
        t.setEmail(minusculo(dto.email()));
        t.setExige2fa(dto.exige2fa());
        t.setCorDestaque(dto.corDestaque() == null ? "violeta" : dto.corDestaque());
        t.setAtivo(true);
        return t;
    }

    public static void atualizarEntidade(Tenant t, TenantUpdateDto dto) {
        t.setNome(dto.nome().trim());
        t.setDocumento(DocumentoValidator.normalizar(dto.documento()));
        t.setEmail(minusculo(dto.email()));
        t.setExige2fa(dto.exige2fa());
        t.setCorDestaque(dto.corDestaque());
    }

    private static String minusculo(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim().toLowerCase(Locale.ROOT);
    }
}
