package com.api.ero_erp.produto.dtos;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Criar e alterar levam os mesmos campos. O código não vem da tela — é o
 * sistema que o gera —, e {@code ativo} tem rota própria.
 *
 * @param ean   opcional; só dígitos, 8, 12, 13 ou 14, e o verificador tem de
 *              fechar — o service confere e responde com a frase
 * @param custo opcional; {@code null} fica gravado como não informado
 */
public record ProdutoRequestDto(
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 150, message = "Nome aceita até 150 caracteres")
        String nome,

        @Size(max = 2000, message = "Descrição aceita até 2000 caracteres")
        String descricao,

        @Size(max = 14, message = "EAN aceita até 14 dígitos")
        String ean,

        @NotNull(message = "Unidade de medida é obrigatória")
        UUID unidadeMedidaId,

        UUID subgrupoId,
        UUID categoriaId,
        UUID marcaId,
        UUID fornecedorId,

        @DecimalMin(value = "0.00", message = "Custo não pode ser negativo")
        @Digits(integer = 13, fraction = 2, message = "Custo aceita até 13 dígitos e 2 casas decimais")
        BigDecimal custo
) {}
