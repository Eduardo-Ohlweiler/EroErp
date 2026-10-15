package com.api.ero_erp.pessoa.dtos;

import com.api.ero_erp.pessoa.enums.Sexo;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Item de combo. Leva o documento junto porque homônimo é comum — "Maria
 * Silva" sozinha não identifica ninguém numa lista de pessoas.
 *
 * <p>{@code dataNascimento} e {@code sexo} viajam junto para a tela que
 * escolhe a pessoa poder preencher esses campos sem uma segunda ida ao
 * servidor. Ambos podem vir nulos — cadastro incompleto ou pessoa jurídica.
 */
public record PessoaSelectDto(
        UUID id,
        String nome,
        String documento,
        LocalDate dataNascimento,
        Sexo sexo
) {}
