package com.api.ero_api.pessoa.dtos;

import com.api.ero_api.auxiliar.dtos.TipoCadastroSelectDto;
import com.api.ero_api.pessoa.enums.Sexo;
import com.api.ero_api.pessoa.enums.TipoPessoa;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Ficha da pessoa como a API devolve (GET por id, criar, alterar). Os campos do outro
 * tipo saem nulos. As listas vêm na ordem gravada; tipos de cadastro e vínculos, por nome.
 * Auditoria com nome, como no {@code UsuarioResponseDto}.
 */
@Schema(description = "Pessoa")
public record PessoaResponseDto(
        UUID id,
        @Schema(description = "Código por contratante (gerado)", example = "42") Long codPessoa,
        TipoPessoa tipoPessoa,
        @Schema(description = "Nome (física) ou razão social (jurídica)") String nome,
        String nomeFantasia,
        @Schema(description = "11 dígitos, sem máscara") String cpf,
        String rg,
        LocalDate dataNascimento,
        Sexo sexo,
        @Schema(description = "14 posições, sem máscara") String cnpj,
        String inscricaoEstadual,
        String inscricaoMunicipal,
        String observacao,
        boolean ativo,
        @Schema(description = "Por nome; inativo vem com ativo = false") List<TipoCadastroSelectDto> tiposCadastro,
        List<PessoaTelefoneResponseDto> telefones,
        List<PessoaEmailResponseDto> emails,
        List<PessoaRedeSocialResponseDto> redesSociais,
        List<PessoaEnderecoResponseDto> enderecos,
        @Schema(description = "Por nome da outra pessoa") List<PessoaVinculoResponseDto> vinculos,
        Instant createdAt,
        Instant updatedAt,
        @Schema(description = "Quem cadastrou (vazio dentro do contratante quando foi o suporte da plataforma)") UUID createdBy,
        @Schema(description = "Quem fez a última alteração (vazio dentro do contratante quando foi o suporte da plataforma)") UUID updatedBy,
        @Schema(description = "Nome de quem cadastrou (vazio = sem autor visível daqui)") String criadoPorNome,
        @Schema(description = "Nome de quem fez a última alteração (vazio = sem autor visível daqui)") String alteradoPorNome,
        @Schema(description = "Versão, devolvida no PUT") Long version) {

    /** CPF, RG, nascimento e contatos são dados pessoais: fora de qualquer log. */
    @Override
    public String toString() {
        return "PessoaResponseDto[id=" + id + ", codPessoa=" + codPessoa + ", version=" + version + "]";
    }
}
