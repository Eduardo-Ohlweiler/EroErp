package com.api.ero_api.filial.mapper;

import com.api.ero_api.filial.dtos.FilialCreateDto;
import com.api.ero_api.filial.dtos.FilialPessoaDto;
import com.api.ero_api.filial.dtos.FilialResponseDto;
import com.api.ero_api.filial.dtos.FilialSelectDto;
import com.api.ero_api.filial.dtos.FilialUpdateDto;
import com.api.ero_api.filial.entity.Filial;
import com.api.ero_api.pessoa.entity.Pessoa;
import com.api.ero_api.pessoa.enums.TipoPessoa;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Conversão entidade ↔ DTO da filial, à mão e sem regra de negócio. O que é regra (pessoa
 * livre e ativa, matriz do tipo MATRIZ e ativa) fica no service, que entrega a pessoa e a
 * matriz já conferidas.
 *
 * <ul>
 *   <li>a cor é gravada em maiúsculas ({@link #normalizarCor}): o CHECK do banco só aceita assim;</li>
 *   <li>o código ({@code codFilial}) nunca é copiado da entrada.</li>
 * </ul>
 */
public final class FilialMapper {

    private FilialMapper() {
    }

    // ---------------------------------------------------------------- entrada

    /** {@code matriz}: nula na MATRIZ. */
    public static Filial toEntity(FilialCreateDto dto, Pessoa pessoa, Filial matriz) {
        Filial f = new Filial();
        f.setPessoa(pessoa);
        f.setTipo(dto.tipo());
        f.setMatriz(matriz);
        f.setCor(normalizarCor(dto.cor()));
        f.setAtivo(true);
        return f;
    }

    /** O código e a situação não mudam aqui. */
    public static void atualizarEntidade(Filial f, FilialUpdateDto dto, Pessoa pessoa, Filial matriz) {
        f.setPessoa(pessoa);
        f.setTipo(dto.tipo());
        f.setMatriz(matriz);
        f.setCor(normalizarCor(dto.cor()));
    }

    /** {@code " #3b82f6 "} → {@code "#3B82F6"}. */
    public static String normalizarCor(String cor) {
        return cor == null ? null : cor.trim().toUpperCase(Locale.ROOT);
    }

    // ---------------------------------------------------------------- saída

    /**
     * Lista, ficha, criar e alterar. Pessoa, matriz e a pessoa da matriz já carregadas
     * ({@code JOIN FETCH}). {@code nomes}/{@code plataforma}: auditoria como no {@code UsuarioMapper}.
     */
    public static FilialResponseDto toResponseDto(Filial f, Map<UUID, String> nomes, boolean plataforma) {
        return new FilialResponseDto(
                f.getId(),
                f.getCodFilial(),
                f.getTipo(),
                toPessoaDto(f.getPessoa()),
                f.getMatriz() == null ? null : toSelectDto(f.getMatriz()),
                f.getCor(),
                f.isAtivo(),
                f.getCreatedAt(),
                f.getUpdatedAt(),
                visivel(nomes, f.getCreatedBy(), plataforma),
                visivel(nomes, f.getUpdatedBy(), plataforma),
                nome(nomes, f.getCreatedBy()),
                nome(nomes, f.getUpdatedBy()),
                f.getVersion());
    }

    /** {@code documento}: o CPF da física ou o CNPJ da jurídica, sem máscara. */
    public static FilialPessoaDto toPessoaDto(Pessoa p) {
        return new FilialPessoaDto(
                p.getId(),
                p.getCodPessoa(),
                p.getTipoPessoa(),
                p.getNome(),
                p.getNomeFantasia(),
                p.getTipoPessoa() == TipoPessoa.FISICA ? p.getCpf() : p.getCnpj(),
                p.isAtivo());
    }

    /** Sem documento: o {@code /selecao} é aberto a quem está logado. */
    public static FilialSelectDto toSelectDto(Filial f) {
        return new FilialSelectDto(f.getId(), f.getCodFilial(), f.getPessoa().getNome(), f.getTipo(), f.getCor());
    }

    // ---------------------------------------------------------------- apoio

    private static String nome(Map<UUID, String> nomes, UUID id) {
        return id == null ? null : nomes.get(id);
    }

    /** Fora da visão de plataforma, só sai o id de quem tem nome visível daqui (o superadmin não tem). */
    private static UUID visivel(Map<UUID, String> nomes, UUID id, boolean plataforma) {
        return plataforma || id == null || nomes.containsKey(id) ? id : null;
    }
}
