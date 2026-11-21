package com.api.ero_api.servico.mapper;

import com.api.ero_api.auxiliar.entity.CategoriaServico;
import com.api.ero_api.auxiliar.mapper.CategoriaServicoMapper;
import com.api.ero_api.compartilhado.util.TextoBusca;
import com.api.ero_api.filial.entity.Filial;
import com.api.ero_api.filial.mapper.FilialMapper;
import com.api.ero_api.servico.dtos.ServicoCreateDto;
import com.api.ero_api.servico.dtos.ServicoFilialItemDto;
import com.api.ero_api.servico.dtos.ServicoFilialResponseDto;
import com.api.ero_api.servico.dtos.ServicoResponseDto;
import com.api.ero_api.servico.dtos.ServicoSelectDto;
import com.api.ero_api.servico.dtos.ServicoUpdateDto;
import com.api.ero_api.servico.entity.Servico;
import com.api.ero_api.servico.entity.ServicoFilial;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Conversão entidade ↔ DTO do serviço, à mão e sem regra de negócio. O que é regra
 * (categoria e filiais do contratante, ativas ou já gravadas, filial sem repetir) fica no
 * service, que entrega a categoria e as filiais já conferidas.
 *
 * <ul>
 *   <li>o código ({@code codServico}) nunca é copiado da entrada;</li>
 *   <li>o preço vazio continua nulo (não informado): nunca vira 0.</li>
 * </ul>
 */
public final class ServicoMapper {

    private ServicoMapper() {
    }

    // ---------------------------------------------------------------- entrada

    /** {@code categoria}: nula = sem categoria. */
    public static Servico toEntity(ServicoCreateDto dto, CategoriaServico categoria) {
        Servico s = new Servico();
        preencher(s, dto, categoria);
        s.setAtivo(true);
        return s;
    }

    /** O código e a situação não mudam aqui. */
    public static void atualizarEntidade(Servico s, ServicoUpdateDto dto, CategoriaServico categoria) {
        preencher(s, dados(dto), categoria);
    }

    /** Os campos do PUT na forma do cadastro, para a validação ser uma só. */
    public static ServicoCreateDto dados(ServicoUpdateDto dto) {
        return new ServicoCreateDto(dto.nome(), dto.categoriaId(), dto.duracaoMinutos(), dto.descricao(), dto.valores());
    }

    /** Uma linha da lista: o preço com 2 casas (o DTO já recusou mais que isso), ou nulo. */
    public static ServicoFilial toFilial(ServicoFilialItemDto item, Servico servico, Filial filial) {
        ServicoFilial sf = new ServicoFilial();
        sf.setServico(servico);
        sf.setFilial(filial);
        sf.setValor(item.valor() == null ? null : item.valor().setScale(2, RoundingMode.UNNECESSARY));
        return sf;
    }

    // ---------------------------------------------------------------- saída

    /**
     * Lista, ficha, criar e alterar. Categoria já carregada ({@code JOIN FETCH}); {@code filiais}
     * com a filial e a pessoa dela. {@code nomes}/{@code plataforma}: auditoria como no
     * {@code UsuarioMapper}.
     */
    public static ServicoResponseDto toResponseDto(Servico s, List<ServicoFilial> filiais, Map<UUID, String> nomes,
                                                   boolean plataforma) {
        return new ServicoResponseDto(
                s.getId(),
                s.getCodServico(),
                s.getNome(),
                s.getCategoria() == null ? null : CategoriaServicoMapper.toSelectDto(s.getCategoria()),
                s.getDuracaoMinutos(),
                s.getDescricao(),
                filiais.stream().map(ServicoMapper::toFilialResponseDto).toList(),
                s.isAtivo(),
                s.getCreatedAt(),
                s.getUpdatedAt(),
                visivel(nomes, s.getCreatedBy(), plataforma),
                visivel(nomes, s.getUpdatedBy(), plataforma),
                nome(nomes, s.getCreatedBy()),
                nome(nomes, s.getUpdatedBy()),
                s.getVersion());
    }

    public static ServicoFilialResponseDto toFilialResponseDto(ServicoFilial sf) {
        return new ServicoFilialResponseDto(FilialMapper.toSelectDto(sf.getFilial()), sf.getValor(),
                sf.getFilial().isAtivo());
    }

    /** Sem preço nem duração: o {@code /selecao} é aberto a quem está logado. */
    public static ServicoSelectDto toSelectDto(Servico s) {
        return new ServicoSelectDto(s.getId(), s.getCodServico(), s.getNome());
    }

    // ---------------------------------------------------------------- apoio

    private static void preencher(Servico s, ServicoCreateDto dto, CategoriaServico categoria) {
        s.setNome(dto.nome().trim());
        s.setNomeBusca(TextoBusca.normalizar(dto.nome()));
        s.setCategoria(categoria);
        s.setDuracaoMinutos(dto.duracaoMinutos());
        s.setDescricao(textoOuNulo(dto.descricao()));
    }

    /** Vazio ou só espaços → nulo; senão sem sobra nas pontas. */
    private static String textoOuNulo(String texto) {
        return texto == null || texto.isBlank() ? null : texto.trim();
    }

    private static String nome(Map<UUID, String> nomes, UUID id) {
        return id == null ? null : nomes.get(id);
    }

    /** Fora da visão de plataforma, só sai o id de quem tem nome visível daqui (o superadmin não tem). */
    private static UUID visivel(Map<UUID, String> nomes, UUID id, boolean plataforma) {
        return plataforma || id == null || nomes.containsKey(id) ? id : null;
    }
}
