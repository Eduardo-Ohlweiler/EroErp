package com.api.ero_erp.pessoa.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.Set;

public record PessoaUpdateDto(

        @Schema(description = "Nome da pessoa", example = "João da Silva")
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 255)
        String nome,

        @Schema(description = "Data de nascimento (somente pessoa física)", example = "1990-05-20")
        LocalDate dataNascimento,

        @Schema(description = "CPF (somente pessoa física)", example = "12345678901")
        @Size(max = 11)
        String cpf,

        @Schema(description = "RG (somente pessoa física)", example = "1234567")
        @Size(max = 20)
        String rg,

        @Schema(description = "CNPJ (somente pessoa jurídica)", example = "12345678000195")
        @Size(max = 14)
        String cnpj,

        @Schema(description = "Inscrição estadual", example = "123456789")
        @Size(max = 50)
        String inscricaoEstadual,

        @Schema(description = "Inscrição municipal", example = "123456")
        @Size(max = 50)
        String inscricaoMunicipal,

        @Schema(description = "Nome fantasia", example = "Empresa XYZ")
        @Size(max = 255)
        String nomeFantasia,

        @Schema(description = "Razão social", example = "Empresa XYZ Ltda")
        @Size(max = 255)
        String razaoSocial,

        @Schema(description = "IDs dos tipos de cadastro", example = "[1, 2]")
        Set<Long> tiposCadastroIds
) {}