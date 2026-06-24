package com.api.ero_erp.documento.dtos;

import com.api.ero_erp.documento.entity.DocumentoStatus;

import java.time.LocalDate;

public record DocumentoSummaryDto(
        Long            id,
        String          modeloDocumentoNome,
        DocumentoStatus status,
        LocalDate       dataEmissao
) {}
