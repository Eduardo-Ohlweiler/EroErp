package com.api.ero_erp.assinatura.mapper;

import com.api.ero_erp.assinatura.dtos.AssinaturaDocumentoResponseDto;
import com.api.ero_erp.assinatura.dtos.AssinaturaPublicResponseDto;
import com.api.ero_erp.assinatura.dtos.SolicitarAssinaturaResponseDto;
import com.api.ero_erp.assinatura.entity.AssinaturaDocumento;

public class AssinaturaDocumentoMapper {

    private AssinaturaDocumentoMapper() {}

    public static AssinaturaDocumentoResponseDto toDto(AssinaturaDocumento entity) {
        return new AssinaturaDocumentoResponseDto(
                entity.getId(),
                entity.getDocumento().getId(),
                entity.getToken(),
                entity.getStatus(),
                entity.getDadosAssinatura(),
                entity.getIpAssinante(),
                entity.getDataAssinatura()
        );
    }

    public static SolicitarAssinaturaResponseDto toSolicitarDto(AssinaturaDocumento entity) {
        return new SolicitarAssinaturaResponseDto(
                entity.getId(),
                entity.getToken()
        );
    }

    public static AssinaturaPublicResponseDto toPublicDto(AssinaturaDocumento entity, String nomeDocumento, String nomeCliente) {
        return new AssinaturaPublicResponseDto(
                nomeDocumento,
                nomeCliente,
                entity.getStatus()
        );
    }
}
