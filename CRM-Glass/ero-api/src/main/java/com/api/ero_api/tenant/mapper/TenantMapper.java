package com.api.ero_api.tenant.mapper;

import com.api.ero_api.compartilhado.util.DocumentoValidator;
import com.api.ero_api.tenant.dtos.AparenciaDto;
import com.api.ero_api.tenant.dtos.FundoCatalogoDto;
import com.api.ero_api.tenant.dtos.TenantAtualDto;
import com.api.ero_api.tenant.dtos.TenantCreateDto;
import com.api.ero_api.tenant.dtos.TenantResponseDto;
import com.api.ero_api.tenant.dtos.TenantSelectDto;
import com.api.ero_api.tenant.dtos.TenantUpdateDto;
import com.api.ero_api.tenant.entity.Tenant;
import com.api.ero_api.tenant.enums.Fundo;
import java.math.RoundingMode;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

public final class TenantMapper {

    private TenantMapper() {
    }

    /**
     * {@code nomes}: quem cadastrou e quem alterou, já resolvidos pelo service (uma
     * consulta por página, sem N+1). Id fora do mapa sai com o nome vazio.
     */
    public static TenantResponseDto toResponseDto(Tenant t, long usuariosAtivos, Map<UUID, String> nomes) {
        return new TenantResponseDto(
                t.getId(),
                t.getNome(),
                t.getDocumento(),
                t.getEmail(),
                t.isAtivo(),
                t.getLimiteUsuarios(),
                usuariosAtivos,
                toAparenciaDto(t),
                t.getFundoExclusivo(),
                t.getCreatedAt(),
                t.getUpdatedAt(),
                t.getCreatedBy(),
                t.getUpdatedBy(),
                nome(nomes, t.getCreatedBy()),
                nome(nomes, t.getUpdatedBy()),
                t.getVersion());
    }

    public static TenantSelectDto toSelectDto(Tenant t) {
        return new TenantSelectDto(t.getId(), t.getNome());
    }

    public static TenantAtualDto toAtualDto(Tenant t) {
        return new TenantAtualDto(t.getId(), t.getNome(), toAparenciaDto(t));
    }

    public static AparenciaDto toAparenciaDto(Tenant t) {
        return new AparenciaDto(
                t.getCorDestaque(),
                t.getTemaPadrao(),
                t.getFundo(),
                t.isFundoAnimado(),
                t.getVidroDesfoque(),
                t.getFundoFoco(),
                t.getAnimacoes(),
                t.isDesempenhoAutomatico());
    }

    /** Padrão do sistema: os valores iniciais da entidade (iguais aos das migrations 008 e 010). */
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
        // Opcional na entrada: cliente antigo que não manda o campo grava o padrão (false).
        t.setDesempenhoAutomatico(Boolean.TRUE.equals(dto.desempenhoAutomatico()));
    }

    public static FundoCatalogoDto toFundoCatalogoDto(Fundo f) {
        return new FundoCatalogoDto(f, f.rotulo(), f.tipo(), f.exclusiva());
    }

    public static Tenant toEntity(TenantCreateDto dto) {
        Tenant t = new Tenant();
        t.setNome(dto.nome().trim());
        t.setDocumento(DocumentoValidator.normalizar(dto.documento()));
        t.setEmail(minusculo(dto.email()));
        t.setLimiteUsuarios(dto.limiteUsuarios());
        aplicarAparencia(t, dto.aparencia() == null ? aparenciaPadrao() : dto.aparencia());
        t.setAtivo(true);
        return t;
    }

    /** Só os dados cadastrais: a aparência muda por {@link #aplicarAparencia}. */
    public static void atualizarEntidade(Tenant t, TenantUpdateDto dto) {
        t.setNome(dto.nome().trim());
        t.setDocumento(DocumentoValidator.normalizar(dto.documento()));
        t.setEmail(minusculo(dto.email()));
        t.setLimiteUsuarios(dto.limiteUsuarios());
    }

    private static String nome(Map<UUID, String> nomes, UUID id) {
        return id == null ? null : nomes.get(id);
    }

    private static String minusculo(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim().toLowerCase(Locale.ROOT);
    }
}
