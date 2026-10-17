package com.api.ero_erp.auxiliarproduto.service;

import com.api.ero_erp.auxiliarproduto.dtos.SubgrupoRequestDto;
import com.api.ero_erp.auxiliarproduto.dtos.SubgrupoResponseDto;
import com.api.ero_erp.auxiliarproduto.dtos.SubgrupoSelectDto;
import com.api.ero_erp.auxiliarproduto.entity.GrupoProduto;
import com.api.ero_erp.auxiliarproduto.entity.SubgrupoProduto;
import com.api.ero_erp.auxiliarproduto.mapper.AuxiliarProdutoMapper;
import com.api.ero_erp.auxiliarproduto.repository.SubgrupoProdutoRepository;
import com.api.ero_erp.config.PageableUtils;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.exceptions.ConflictException;
import com.api.ero_erp.exceptions.NotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.api.ero_erp.auxiliarproduto.service.AuxiliarSimplesService.textoOuNulo;

/**
 * Subgrupo de produto. Nome único dentro do grupo. O grupo pode mudar: os
 * produtos do subgrupo vão junto, porque apontam para ele e não para o grupo.
 * Grupo novo tem de estar ativo; o que já era continua valendo.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SubgrupoProdutoService {

    private final SubgrupoProdutoRepository subgrupoRepository;
    private final GrupoProdutoService grupoService;
    private final SecurityUtils securityUtils;

    @Transactional(readOnly = true)
    public Page<SubgrupoResponseDto> getAll(Pageable pageable, String termo, UUID grupoId, Boolean ativo) {
        UUID tenantId = securityUtils.getTenantIdLogado();
        Page<UUID> ids = subgrupoRepository.findIdsWithFilters(
                PageableUtils.semOrdenacao(pageable), tenantId, textoOuNulo(termo), grupoId, ativo);
        List<SubgrupoResponseDto> linhas = carregarNaOrdem(ids.getContent(), tenantId).stream()
                .map(AuxiliarProdutoMapper::toResponse)
                .toList();
        return new PageImpl<>(linhas, ids.getPageable(), ids.getTotalElements());
    }

    @Transactional(readOnly = true)
    public List<SubgrupoSelectDto> select(String termo, UUID grupoId) {
        UUID tenantId = securityUtils.getTenantIdLogado();
        List<UUID> ids = subgrupoRepository.findIdsForSelect(tenantId, textoOuNulo(termo), grupoId);
        return carregarNaOrdem(ids, tenantId).stream()
                .map(AuxiliarProdutoMapper::toSelect)
                .toList();
    }

    @Transactional(readOnly = true)
    public SubgrupoResponseDto findByIdResponse(UUID id) {
        return AuxiliarProdutoMapper.toResponse(findById(id));
    }

    @Transactional(readOnly = true)
    public SubgrupoProduto findById(UUID id) {
        UUID tenantId = securityUtils.getTenantIdLogado();
        return subgrupoRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new NotFoundException("Subgrupo não encontrado"));
    }

    /**
     * Para o produto: o do tenant, ativo e de grupo ativo — salvo quando é o
     * que o produto já tinha.
     */
    @Transactional(readOnly = true)
    public SubgrupoProduto exigirParaVinculo(UUID id, UUID idAtual) {
        SubgrupoProduto subgrupo = findById(id);
        if (Objects.equals(id, idAtual)) return subgrupo;
        if (!Boolean.TRUE.equals(subgrupo.getAtivo())) {
            throw new ConflictException("O subgrupo \"" + subgrupo.getNome()
                    + "\" está inativo. Reative antes de usar");
        }
        if (!Boolean.TRUE.equals(subgrupo.getGrupo().getAtivo())) {
            throw new ConflictException("O grupo \"" + subgrupo.getGrupo().getNome()
                    + "\" está inativo. Reative antes de usar o subgrupo");
        }
        return subgrupo;
    }

    @Transactional
    public SubgrupoResponseDto create(SubgrupoRequestDto dto) {
        String nome = dto.nome().trim();
        GrupoProduto grupo = grupoService.exigirParaVinculo(dto.grupoId(), null);
        exigirNomeLivre(grupo, nome, null);

        SubgrupoProduto subgrupo = new SubgrupoProduto();
        subgrupo.setTenant(securityUtils.getTenantReference());
        subgrupo.setGrupo(grupo);
        subgrupo.setNome(nome);
        SubgrupoProduto salvo = subgrupoRepository.save(subgrupo);

        log.info("subgrupo criado id={}", salvo.getId());
        return AuxiliarProdutoMapper.toResponse(salvo);
    }

    @Transactional
    public SubgrupoResponseDto update(UUID id, SubgrupoRequestDto dto) {
        SubgrupoProduto subgrupo = findById(id);
        String nome = dto.nome().trim();
        GrupoProduto grupo = grupoService.exigirParaVinculo(dto.grupoId(), subgrupo.getGrupo().getId());
        // Antes de mexer na entidade: a native descarrega a sessão
        exigirNomeLivre(grupo, nome, id);

        subgrupo.setGrupo(grupo);
        subgrupo.setNome(nome);

        log.info("subgrupo alterado id={}", id);
        return AuxiliarProdutoMapper.toResponse(subgrupoRepository.save(subgrupo));
    }

    @Transactional
    public SubgrupoResponseDto alterarAtivo(UUID id, boolean ativo) {
        SubgrupoProduto subgrupo = findById(id);
        subgrupo.setAtivo(ativo);

        log.info("subgrupo {} alterado para ativo={}", id, ativo);
        return AuxiliarProdutoMapper.toResponse(subgrupoRepository.save(subgrupo));
    }

    private void exigirNomeLivre(GrupoProduto grupo, String nome, UUID ignorarId) {
        if (subgrupoRepository.existeNome(grupo.getId(), nome, ignorarId)) {
            throw new ConflictException("Já existe um subgrupo com o nome \"" + nome
                    + "\" no grupo \"" + grupo.getNome() + "\"");
        }
    }

    private List<SubgrupoProduto> carregarNaOrdem(List<UUID> ids, UUID tenantId) {
        if (ids.isEmpty()) return List.of();
        Map<UUID, Integer> posicao = ids.stream()
                .collect(Collectors.toMap(Function.identity(), ids::indexOf));
        return subgrupoRepository.findAllComGrupo(ids, tenantId).stream()
                .sorted(Comparator.comparing(s -> posicao.get(s.getId())))
                .toList();
    }
}
