package com.api.ero_erp.otorrino.dto;

import com.api.ero_erp.otorrino.enums.OrelhaEnum;
import com.api.ero_erp.otorrino.enums.ViaEnum;

public record AudiometriaLimiarResponseDto(
        Long       id,
        OrelhaEnum orelha,
        ViaEnum    via,
        Integer    frequencia,
        Integer    limiarDb,
        boolean    mascarado,
        boolean    semResposta
) {}
