package com.api.ero_api.pessoa.dtos;

import com.api.ero_api.auxiliar.dtos.EstadoCivilSelectDto;
import com.api.ero_api.auxiliar.dtos.ProfissaoSelectDto;
import com.api.ero_api.auxiliar.dtos.TipoCadastroSelectDto;
import com.api.ero_api.localidade.dtos.CidadeSelectDto;
import com.api.ero_api.localidade.dtos.EstadoSelectDto;
import com.api.ero_api.pessoa.enums.CategoriaCnh;
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
 * As referências (UF do RG, estado civil, profissão, naturalidade) vêm como {@code SelectDto},
 * nulas quando não informadas. Os dados complementares só existem aqui, na ficha: a lista e
 * a exportação ({@link PessoaListaDto}) não os têm.
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
        @Schema(description = "Só física: órgão emissor do RG") String rgOrgaoEmissor,
        @Schema(description = "Só física: UF do órgão emissor do RG") EstadoSelectDto rgUf,
        LocalDate rgDataEmissao,
        @Schema(description = "Só física: 11 dígitos, sem máscara") String cnh,
        CategoriaCnh cnhCategoria,
        @Schema(description = "Pode estar vencida") LocalDate cnhValidade,
        @Schema(description = "Inativo vem com ativo = false") EstadoCivilSelectDto estadoCivil,
        @Schema(description = "Inativa vem com ativo = false") ProfissaoSelectDto profissao,
        String nacionalidade,
        @Schema(description = "Cidade onde nasceu") CidadeSelectDto naturalidade,
        String nomeMae,
        String nomePai,
        @Schema(description = "14 posições, sem máscara") String cnpj,
        String inscricaoEstadual,
        String inscricaoMunicipal,
        @Schema(description = "Só jurídica") LocalDate dataAbertura,
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

    /** CPF, RG, CNH, nascimento, filiação, estado civil e contatos são dados pessoais: fora de qualquer log. */
    @Override
    public String toString() {
        return "PessoaResponseDto[id=" + id + ", codPessoa=" + codPessoa + ", version=" + version + "]";
    }
}
