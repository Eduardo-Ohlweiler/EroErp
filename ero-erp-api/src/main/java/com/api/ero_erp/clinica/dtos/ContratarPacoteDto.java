package com.api.ero_erp.clinica.dtos;

import com.api.ero_erp.financeiro.contareceber.dtos.ParcelaContaReceberCreateDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.List;

public record ContratarPacoteDto(

        @NotNull(message = "Emitente é obrigatório")
        Long emitenteId,

        @NotNull(message = "Pessoa é obrigatória")
        Long pessoaId,

        @NotNull(message = "Serviço é obrigatório")
        Long produtoId,

        @NotBlank(message = "Nome do pacote é obrigatório")
        String nome,

        @NotNull(message = "Quantidade de sessões é obrigatória")
        @Min(value = 1, message = "O pacote deve ter ao menos 1 sessão")
        Integer quantidadeSessoes,

        @NotNull(message = "Valor total é obrigatório")
        @Positive(message = "Valor total deve ser positivo")
        BigDecimal valorTotal,

        String observacao,

        @NotEmpty(message = "É necessário informar as datas das sessões")
        @Valid
        List<SessaoSlotDto> sessoes,

        @NotEmpty(message = "É necessário ao menos uma parcela")
        @Valid
        List<ParcelaContaReceberCreateDto> parcelas
) {}
