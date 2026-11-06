package com.api.ero_api.tenant.mapper;

import com.api.ero_api.tenant.dtos.AparenciaDto;
import com.api.ero_api.tenant.dtos.FundoCatalogoDto;
import com.api.ero_api.tenant.dtos.TenantAtualDto;
import com.api.ero_api.tenant.dtos.TenantCreateDto;
import com.api.ero_api.tenant.dtos.TenantResponseDto;
import com.api.ero_api.tenant.dtos.TenantSelectDto;
import com.api.ero_api.tenant.dtos.TenantUpdateDto;
import com.api.ero_api.tenant.entity.Tenant;
import com.api.ero_api.tenant.enums.Fundo;
import com.api.ero_api.tenant.util.DocumentoValidator;
import java.math.RoundingMode;
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
                toAparenciaDto(t),
                t.getFundoExclusivo(),
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
        return new TenantAtualDto(t.getId(), t.getNome(), t.isExige2fa(), toAparenciaDto(t));
    }

    public static AparenciaDto toAparenciaDto(Tenant t) {
        return new AparenciaDto(
                t.getCorDestaque(),
                t.getTemaPadrao(),
                t.getFundo(),
                t.isFundoAnimado(),
                t.getVidroDesfoque(),
                t.getFundoFoco(),
                t.getAnimacoes());
    }

    /** Padrão do sistema: os valores iniciais da entidade (iguais aos da migration 008). */
    public static AparenciaDto aparenciaPadrao() {
        return toAparenciaDto(new Tenant());
    }

    public static void aplicarAparencia(Tenant t, AparenciaDto dto) {
        t.setCorDestaque(dto.corDestaque());
        t.setTemaPadrao(dto.temaPadrao());
        t.setFundo(dto.fundo());
        t.setFundoAnimado(dto.fundoAnimado());
        t.setVidroDesfoque(dto.vidroDesfoque());
        // A coluna é NUMERIC(3,1): "4.50" e "4.5" gravam igual e a resposta sai com uma casa.
        t.setFundoFoco(dto.fundoFoco().setScale(1, RoundingMode.UNNECESSARY));
        t.setAnimacoes(dto.animacoes());
    }

    public static FundoCatalogoDto toFundoCatalogoDto(Fundo f) {
        return new FundoCatalogoDto(f, f.rotulo(), f.tipo(), f.exclusiva());
    }

    public static Tenant toEntity(TenantCreateDto dto) {
        Tenant t = new Tenant();
        t.setNome(dto.nome().trim());
        t.setDocumento(DocumentoValidator.normalizar(dto.documento()));
        t.setEmail(minusculo(dto.email()));
        t.setExige2fa(dto.exige2fa());
        aplicarAparencia(t, dto.aparencia() == null ? aparenciaPadrao() : dto.aparencia());
        t.setAtivo(true);
        return t;
    }

    /** Só os dados cadastrais: a aparência muda por {@link #aplicarAparencia}. */
    public static void atualizarEntidade(Tenant t, TenantUpdateDto dto) {
        t.setNome(dto.nome().trim());
        t.setDocumento(DocumentoValidator.normalizar(dto.documento()));
        t.setEmail(minusculo(dto.email()));
        t.setExige2fa(dto.exige2fa());
    }

    private static String minusculo(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim().toLowerCase(Locale.ROOT);
    }
}
