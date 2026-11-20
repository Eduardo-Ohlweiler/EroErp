package com.api.ero_api.pessoa.dtos;

import com.api.ero_api.pessoa.enums.Sexo;
import com.api.ero_api.pessoa.enums.TipoPessoa;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Edição completa (PUT): o formulário manda todos os campos e todas as listas de novo
 * (cada lista substitui a anterior). {@code version} é a versão que o usuário viu; se
 * alguém salvou antes, inclusive um vínculo pelo outro lado, dá 409.
 */
@Schema(description = "Dados para alterar uma pessoa")
public record PessoaUpdateDto(

        @Schema(description = "FISICA ou JURIDICA. Trocar o tipo limpa os campos do anterior", example = "FISICA")
        @NotNull(message = "Tipo de pessoa é obrigatório")
        TipoPessoa tipoPessoa,

        @Schema(description = "Nome (física) ou razão social (jurídica)", example = "Marina Souza")
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 255, message = "Nome deve ter no máximo 255 caracteres")
        String nome,

        @Schema(description = "Só física. Com ou sem máscara", example = "123.456.789-09")
        @Size(max = 14, message = "CPF deve ter no máximo 14 caracteres")
        String cpf,

        @Schema(description = "Só física. De 6 a 10 caracteres sem ponto, hífen nem espaço")
        @Size(max = 20, message = "RG deve ter no máximo 20 caracteres")
        String rg,

        @Schema(description = "Só física", example = "1990-05-17")
        @PastOrPresent(message = "Data de nascimento não pode ser no futuro")
        LocalDate dataNascimento,

        @Schema(description = "Só física. MASCULINO, FEMININO ou nulo (não informado)")
        Sexo sexo,

        @Schema(description = "Só jurídica. Com ou sem máscara; aceita o CNPJ alfanumérico", example = "11.222.333/0001-81")
        @Size(max = 18, message = "CNPJ deve ter no máximo 18 caracteres")
        String cnpj,

        @Schema(description = "Só jurídica")
        @Size(max = 255, message = "Nome fantasia deve ter no máximo 255 caracteres")
        String nomeFantasia,

        @Schema(description = "Só jurídica. De 5 a 12 dígitos (a máscara é ignorada)")
        @Size(max = 20, message = "Inscrição estadual deve ter no máximo 20 caracteres")
        String inscricaoEstadual,

        @Schema(description = "Só jurídica. De 5 a 12 dígitos (a máscara é ignorada)")
        @Size(max = 20, message = "Inscrição municipal deve ter no máximo 20 caracteres")
        String inscricaoMunicipal,

        @Size(max = 500, message = "Observação deve ter no máximo 500 caracteres")
        String observacao,

        @Schema(description = "Ids dos tipos de cadastro (/api/tipos-cadastro/selecao)")
        @NotEmpty(message = "Selecione ao menos um tipo de cadastro")
        @Size(max = 20, message = "Selecione no máximo 20 tipos de cadastro")
        Set<@NotNull(message = "Tipo de cadastro é obrigatório") UUID> tiposCadastroIds,

        @Size(max = 20, message = "No máximo 20 telefones")
        List<@NotNull(message = "Telefone vazio") @Valid PessoaTelefoneItemDto> telefones,

        @Size(max = 20, message = "No máximo 20 e-mails")
        List<@NotNull(message = "E-mail vazio") @Valid PessoaEmailItemDto> emails,

        @Size(max = 20, message = "No máximo 20 redes sociais")
        List<@NotNull(message = "Rede social vazia") @Valid PessoaRedeSocialItemDto> redesSociais,

        @Size(max = 10, message = "No máximo 10 endereços")
        List<@NotNull(message = "Endereço vazio") @Valid PessoaEnderecoItemDto> enderecos,

        @Size(max = 20, message = "No máximo 20 vínculos")
        List<@NotNull(message = "Vínculo vazio") @Valid PessoaVinculoItemDto> vinculos,

        @Schema(description = "Versão do registro que está sendo editado", example = "3")
        @NotNull(message = "Versão é obrigatória")
        Long version) {

    /** CPF, RG, nascimento e contatos são dados pessoais: fora de qualquer log. */
    @Override
    public String toString() {
        return "PessoaUpdateDto[tipoPessoa=" + tipoPessoa + ", nome=" + nome + ", version=" + version + "]";
    }
}
