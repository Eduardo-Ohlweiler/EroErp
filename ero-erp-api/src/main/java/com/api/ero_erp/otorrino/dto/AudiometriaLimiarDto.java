package com.api.ero_erp.otorrino.dto;

import com.api.ero_erp.otorrino.enums.OrelhaEnum;
import com.api.ero_erp.otorrino.enums.ViaEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

public record AudiometriaLimiarDto(

        @Schema(description = "Orelha: OD ou OE")
        @NotNull(message = "Orelha é obrigatória")
        OrelhaEnum orelha,

        @Schema(description = "Via: AEREA ou OSSEA")
        @NotNull(message = "Via é obrigatória")
        ViaEnum via,

        @Schema(description = "Frequência em Hz: 250, 500, 1000, 2000, 3000, 4000, 6000, 8000")
        @NotNull(message = "Frequência é obrigatória")
        Integer frequencia,

        @Schema(description = "Limiar em dB — null quando não testado")
        Integer limiarDb,

        @Schema(description = "Ponto testado com mascaramento")
        boolean mascarado,

        @Schema(description = "Testado, porém sem resposta")
        boolean semResposta

) {}
