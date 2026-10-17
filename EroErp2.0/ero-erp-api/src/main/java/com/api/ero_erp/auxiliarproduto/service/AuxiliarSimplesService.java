package com.api.ero_erp.auxiliarproduto.service;

import com.api.ero_erp.auxiliarproduto.dtos.AuxiliarRequestDto;
import com.api.ero_erp.auxiliarproduto.dtos.AuxiliarResponseDto;
import com.api.ero_erp.auxiliarproduto.dtos.AuxiliarSelectDto;
import com.api.ero_erp.auxiliarproduto.entity.AuxiliarProdutoEntity;
import com.api.ero_erp.auxiliarproduto.mapper.AuxiliarProdutoMapper;
import com.api.ero_erp.auxiliarproduto.repository.AuxiliarSimplesRepository;
import com.api.ero_erp.config.PageableUtils;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.exceptions.ConflictException;
import com.api.ero_erp.exceptions.NotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Supplier;

/**
 * Grupo, categoria e marca têm a mesma vida: nome único no tenant, sem delete,
 * inativa-se. Esta base a escreve uma vez; cada serviço concreto diz só o
 * nome da coisa, para as frases saírem certas ("uma categoria", "o grupo").
 *
 * <p>Logs levam só id e operação (regra 5 do CLAUDE.md).
 */
@Slf4j
public abstract class AuxiliarSimplesService<T extends AuxiliarProdutoEntity> {

    /**
     * @param nome     em minúscula, como entra no meio da frase
     * @param feminino para "uma categoria … não encontrada"
     */
    protected record Rotulo(String nome, boolean feminino) {
        String artigoIndefinido() { return feminino ? "uma" : "um"; }
        String naoEncontrado() {
            return Character.toUpperCase(nome.charAt(0)) + nome.substring(1)
                    + (feminino ? " não encontrada" : " não encontrado");
        }
        String estaInativo(String nomeDoItem) {
            return (feminino ? "A " : "O ") + nome + " \"" + nomeDoItem + "\" está "
                    + (feminino ? "inativa" : "inativo") + ". Reative antes de usar";
        }
    }

    private final AuxiliarSimplesRepository<T> repository;
    private final SecurityUtils securityUtils;
    private final Rotulo rotulo;
    private final Supplier<T> fabrica;

    protected AuxiliarSimplesService(AuxiliarSimplesRepository<T> repository, SecurityUtils securityUtils,
                                     Rotulo rotulo, Supplier<T> fabrica) {
        this.repository = repository;
        this.securityUtils = securityUtils;
        this.rotulo = rotulo;
        this.fabrica = fabrica;
    }

    @Transactional(readOnly = true)
    public Page<AuxiliarResponseDto> getAll(Pageable pageable, String termo, Boolean ativo) {
        UUID tenantId = securityUtils.getTenantIdLogado();
        return repository.findWithFilters(PageableUtils.semOrdenacao(pageable), tenantId, textoOuNulo(termo), ativo)
                .map(AuxiliarProdutoMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public List<AuxiliarSelectDto> select(String termo) {
        UUID tenantId = securityUtils.getTenantIdLogado();
        return repository.findForSelect(tenantId, textoOuNulo(termo)).stream()
                .map(AuxiliarProdutoMapper::toSelect)
                .toList();
    }

    @Transactional(readOnly = true)
    public AuxiliarResponseDto findByIdResponse(UUID id) {
        return AuxiliarProdutoMapper.toResponse(findById(id));
    }

    @Transactional(readOnly = true)
    public T findById(UUID id) {
        UUID tenantId = securityUtils.getTenantIdLogado();
        return repository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new NotFoundException(rotulo.naoEncontrado()));
    }

    /**
     * Para quem aponta para o auxiliar (o produto, o subgrupo): o do tenant, e
     * ativo — salvo quando é o que já estava. Inativado depois, continua lá,
     * como a filial do serviço.
     */
    @Transactional(readOnly = true)
    public T exigirParaVinculo(UUID id, UUID idAtual) {
        T item = findById(id);
        if (!Boolean.TRUE.equals(item.getAtivo()) && !Objects.equals(id, idAtual)) {
            throw new ConflictException(rotulo.estaInativo(item.getNome()));
        }
        return item;
    }

    @Transactional
    public AuxiliarResponseDto create(AuxiliarRequestDto dto) {
        UUID tenantId = securityUtils.getTenantIdLogado();
        String nome = dto.nome().trim();
        exigirNomeLivre(tenantId, nome, null);

        T item = fabrica.get();
        item.setTenant(securityUtils.getTenantReference());
        item.setNome(nome);
        T salvo = repository.save(item);

        log.info("{} criado id={}", rotulo.nome(), salvo.getId());
        return AuxiliarProdutoMapper.toResponse(salvo);
    }

    @Transactional
    public AuxiliarResponseDto update(UUID id, AuxiliarRequestDto dto) {
        T item = findById(id);
        String nome = dto.nome().trim();
        // Antes de mexer na entidade: a native descarrega a sessão
        exigirNomeLivre(item.getTenant().getId(), nome, id);
        item.setNome(nome);

        log.info("{} alterado id={}", rotulo.nome(), id);
        return AuxiliarProdutoMapper.toResponse(repository.save(item));
    }

    @Transactional
    public AuxiliarResponseDto alterarAtivo(UUID id, boolean ativo) {
        T item = findById(id);
        item.setAtivo(ativo);

        log.info("{} {} alterado para ativo={}", rotulo.nome(), id, ativo);
        return AuxiliarProdutoMapper.toResponse(repository.save(item));
    }

    private void exigirNomeLivre(UUID tenantId, String nome, UUID ignorarId) {
        if (repository.existeNome(tenantId, nome, ignorarId)) {
            throw new ConflictException("Já existe " + rotulo.artigoIndefinido() + " " + rotulo.nome()
                    + " com o nome \"" + nome + "\"");
        }
    }


    static String textoOuNulo(String valor) {
        return valor != null && !valor.isBlank() ? valor.trim() : null;
    }
}
