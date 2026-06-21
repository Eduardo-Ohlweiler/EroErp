package com.api.ero_erp.otorrino.dto;

import java.time.LocalDate;

public record ImitanciometriaSummaryDto(
        Long      id,
        Long      pessoaId,
        String    pessoaNome,
        LocalDate dataExame,
        String    curvaOd,
        String    curvaOe
) {}
