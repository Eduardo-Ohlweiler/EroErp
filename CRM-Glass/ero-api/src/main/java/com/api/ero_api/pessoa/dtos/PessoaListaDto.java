package com.api.ero_api.pessoa.dtos;

import com.api.ero_api.auxiliar.dtos.TipoCadastroSelectDto;
import com.api.ero_api.pessoa.enums.TipoPessoa;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import java.util.UUID;

/**
 * Linha da lista de pessoas (e da exportação). Só o que a grade mostra: sem nascimento,
 * sem RG e sem auditoria (decisão do dono: exporta quem tem PESSOAS_LER, sem nascimento).
 * Os "principais" são o telefone, o e-mail e a cidade marcados como principal.
 */
@Schema(description = "Pessoa na lista")
public record PessoaListaDto(
        UUID id,
        @Schema(example = "42") Long codPessoa,
        TipoPessoa tipoPessoa,
        @Schema(description = "Nome (física) ou razão social (jurídica)") String nome,
        String nomeFantasia,
        @Schema(description = "CPF (11) ou CNPJ (14), sem máscara; nulo = sem documento") String documento,
        @Schema(description = "Por nome") List<TipoCadastroSelectDto> tiposCadastro,
        @Schema(description = "Com DDD, só dígitos") String telefonePrincipal,
        String emailPrincipal,
        @Schema(description = "Cidade do endereço principal") String cidadePrincipal,
        @Schema(description = "UF do endereço principal", example = "SP") String ufPrincipal,
        boolean ativo) {

    /** Documento e contatos são dados pessoais: fora de qualquer log. */
    @Override
    public String toString() {
        return "PessoaListaDto[id=" + id + ", codPessoa=" + codPessoa + "]";
    }
}
