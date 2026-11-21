package com.api.ero_api.servico.dtos;

import com.api.ero_api.filial.dtos.FilialSelectDto;
import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;

/** Filial onde o serviço é prestado e o preço nela, como a API devolve (por código da filial). */
@Schema(description = "Filial do serviço")
public record ServicoFilialResponseDto(
        @Schema(description = "A filial (id, código, nome, tipo e cor)") FilialSelectDto filial,
        @Schema(description = "Preço nesta filial. Nulo = não informado; 0 = gratuito", example = "150.00") BigDecimal valor,
        @Schema(description = "false = a filial foi inativada depois de gravada (fica, sinalizada; o preço ainda se corrige)") boolean filialAtiva) {
}
