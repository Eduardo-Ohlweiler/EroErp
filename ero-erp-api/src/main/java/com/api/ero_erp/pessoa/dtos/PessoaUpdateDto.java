package com.api.ero_erp.pessoa.dtos;

import com.api.ero_erp.pessoa.enums.TipoPessoa;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.Set;

public record PessoaUpdateDto(

        @Schema(description = "Nome da pessoa", example = "João da Silva")
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 255, message = "Nome deve ter no máximo 255 caracteres")
        String nome,

        @Schema(description = "Tipo da pessoa: PESSOA_FISICA ou PESSOA_JURIDICA", example = "PESSOA_FISICA")
        @NotNull(message = "Tipo de pessoa é obrigatório")
        TipoPessoa tipoPessoa,

        @Schema(description = "Data de nascimento (somente pessoa física)", example = "1990-05-20")
        LocalDate dataNascimento,

        @Schema(description = "CPF (somente pessoa física, sem formatação)", example = "12345678901")
        @Size(max = 11, message = "CPF deve ter no máximo 11 caracteres")
        String cpf,

        @Schema(description = "RG (somente pessoa física)", example = "1234567")
        @Size(max = 20, message = "RG deve ter no máximo 20 caracteres")
        String rg,

        @Schema(description = "Número da CNH (somente pessoa física)", example = "12345678901")
        @Size(max = 11, message = "CNH deve ter no máximo 11 caracteres")
        String cnh,

        @Schema(description = "Categoria da CNH (somente pessoa física)", example = "AB")
        @Size(max = 5, message = "Categoria da CNH deve ter no máximo 5 caracteres")
        String cnhCategoria,

        @Schema(description = "Validade da CNH (somente pessoa física)", example = "2028-05-10")
        LocalDate cnhValidade,

        @Schema(description = "CNPJ (somente pessoa jurídica, sem formatação)", example = "12345678000195")
        @Size(max = 14, message = "CNPJ deve ter no máximo 14 caracteres")
        String cnpj,

        @Schema(description = "Inscrição estadual (somente pessoa jurídica)", example = "123456789")
        @Size(max = 50, message = "Inscrição estadual deve ter no máximo 50 caracteres")
        String inscricaoEstadual,

        @Schema(description = "Inscrição municipal (somente pessoa jurídica)", example = "123456")
        @Size(max = 50, message = "Inscrição municipal deve ter no máximo 50 caracteres")
        String inscricaoMunicipal,

        @Schema(description = "Nome fantasia (somente pessoa jurídica)", example = "Empresa XYZ")
        @Size(max = 255, message = "Nome fantasia deve ter no máximo 255 caracteres")
        String nomeFantasia,

        @Schema(description = "Razão social (somente pessoa jurídica)", example = "Empresa XYZ Ltda")
        @Size(max = 255, message = "Razão social deve ter no máximo 255 caracteres")
        String razaoSocial,

        @Schema(description = "IDs dos tipos de cadastro", example = "[1, 2]")
        Set<Long> tiposCadastroIds,

        @Schema(description = "Definir se a pessoa esta ativa", example = "true")
        Boolean ativo
) {}