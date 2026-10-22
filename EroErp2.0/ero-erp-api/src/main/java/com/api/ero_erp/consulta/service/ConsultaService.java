package com.api.ero_erp.consulta.service;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.compromisso.dtos.CancelarCompromissoDto;
import com.api.ero_erp.compromisso.dtos.CompromissoUpdateDto;
import com.api.ero_erp.compromisso.entity.Compromisso;
import com.api.ero_erp.compromisso.enums.StatusCompromisso;
import com.api.ero_erp.compromisso.service.CompromissoService;
import com.api.ero_erp.config.PageableUtils;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.consulta.dtos.ConsultaCalculoDto;
import com.api.ero_erp.consulta.dtos.ConsultaCalculoRequestDto;
import com.api.ero_erp.consulta.dtos.ConsultaCreateDto;
import com.api.ero_erp.consulta.dtos.ConsultaListaDto;
import com.api.ero_erp.consulta.dtos.ConsultaProdutoItemDto;
import com.api.ero_erp.consulta.dtos.ConsultaResponseDto;
import com.api.ero_erp.consulta.dtos.ConsultaServicoItemDto;
import com.api.ero_erp.consulta.dtos.ConsultaUpdateDto;
import com.api.ero_erp.consulta.dtos.PrecoSugeridoDto;
import com.api.ero_erp.consulta.dtos.ReconsultaDto;
import com.api.ero_erp.consulta.entity.Consulta;
import com.api.ero_erp.consulta.entity.ConsultaItem;
import com.api.ero_erp.consulta.entity.ConsultaProduto;
import com.api.ero_erp.consulta.entity.ConsultaServico;
import com.api.ero_erp.consulta.enums.TipoAjuste;
import com.api.ero_erp.consulta.enums.TipoCalculo;
import com.api.ero_erp.consulta.mapper.ConsultaMapper;
import com.api.ero_erp.consulta.repository.ConsultaRepository;
import com.api.ero_erp.consulta.service.CalculoConsulta.Ajuste;
import com.api.ero_erp.consulta.service.CalculoConsulta.Linha;
import com.api.ero_erp.consulta.service.CalculoConsulta.Resultado;
import com.api.ero_erp.estoque.entity.Estoque;
import com.api.ero_erp.estoque.service.EstoqueService;
import com.api.ero_erp.exceptions.BadRequestException;
import com.api.ero_erp.exceptions.ConflictException;
import com.api.ero_erp.exceptions.ForbiddenException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.permissao.enums.Tela;
import com.api.ero_erp.produto.dtos.ProdutoSelectDto;
import com.api.ero_erp.produto.entity.Produto;
import com.api.ero_erp.produto.mapper.ProdutoMapper;
import com.api.ero_erp.produto.service.ProdutoService;
import com.api.ero_erp.servico.entity.Servico;
import com.api.ero_erp.servico.service.ServicoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Consulta — o atendimento sobre um compromisso, com serviços e produtos.
 * Redesenho da {@code clinica/consulta} do EroErp antigo. Ver docs/12 §7.
 *
 * <p>A situação é <b>uma só</b>, a do compromisso: iniciar, concluir,
 * cancelar e falta mudam o compromisso, e a agenda e a consulta nunca
 * divergem. Concluir só daqui, porque é aqui que o estoque baixa.
 *
 * <p>As listas de itens seguem a regra da pessoa: lista nula não mexe, lista
 * enviada é o estado completo. E seguem a permissão: quem não lê Serviços
 * (ou Produtos) não manda a lista — 403 — e não a recebe na resposta.
 *
 * <p>Logs levam só id e operação (regra 5 do CLAUDE.md).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ConsultaService {

    private final ConsultaRepository consultaRepository;
    private final CompromissoService compromissoService;
    private final ServicoService servicoService;
    private final ProdutoService produtoService;
    private final EstoqueService estoqueService;
    private final SecurityUtils securityUtils;

    // ─────────────────────────────────────────────────────────────────────
    //  Leitura
    // ─────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<ConsultaListaDto> getAll(Pageable pageable, UUID filialId, UUID responsavelId, UUID pessoaId,
                                         StatusCompromisso status, Instant de, Instant ate) {
        UUID tenantId = securityUtils.getTenantIdLogado();
        Page<UUID> ids = consultaRepository.findIdsWithFilters(PageableUtils.semOrdenacao(pageable), tenantId,
                filialId, responsavelId, pessoaId, status != null ? status.name() : null, de, ate);
        List<ConsultaListaDto> linhas = carregarNaOrdem(ids.getContent(), tenantId).stream()
                .map(c -> ConsultaMapper.toLista(c, calcular(c).total()))
                .toList();
        return new PageImpl<>(linhas, ids.getPageable(), ids.getTotalElements());
    }

    @Transactional(readOnly = true)
    public ConsultaResponseDto findByIdResponse(UUID id) {
        return responder(findById(id));
    }

    @Transactional(readOnly = true)
    public Consulta findById(UUID id) {
        return consultaRepository.findByIdAndTenantId(id, securityUtils.getTenantIdLogado())
                .orElseThrow(() -> new NotFoundException("Consulta não encontrada"));
    }

    /**
     * Os totais de um corpo, sem gravar — a mesma conta e as mesmas guardas
     * do salvar. Numa consulta em edição, a lista que não veio vale a gravada.
     */
    @Transactional(readOnly = true)
    public ConsultaCalculoDto calculo(ConsultaCalculoRequestDto dto) {
        exigirAcessoAsListas(dto.servicos(), dto.produtos());
        Ajuste geral = Ajuste.de("geral", dto.tipoAjusteGeral(), dto.tipoCalculoGeral(), dto.valorAjusteGeral());
        Consulta salva = dto.consultaId() != null ? findById(dto.consultaId()) : null;

        List<Linha> servicos;
        if (dto.servicos() != null) {
            servicos = resolverServicos(dto.servicos(), dto.filialId(),
                    salva != null ? salva.getServicos() : List.of()).stream()
                    .map(r -> linha(r.descricao(), BigDecimal.valueOf(r.item().quantidade()), r.preco(),
                            r.item().tipoAjuste(), r.item().tipoCalculo(), r.item().valorAjuste()))
                    .toList();
        } else {
            servicos = salva != null ? linhas(salva.getServicos()) : List.of();
        }

        List<Linha> produtos;
        if (dto.produtos() != null) {
            produtos = resolverProdutos(dto.produtos(), dto.filialId(),
                    salva != null ? salva.getProdutos() : List.of(), false).stream()
                    .map(r -> linha(r.descricao(), r.item().quantidade(), r.preco(),
                            r.item().tipoAjuste(), r.item().tipoCalculo(), r.item().valorAjuste()))
                    .toList();
        } else {
            produtos = salva != null ? linhas(salva.getProdutos()) : List.of();
        }

        Resultado r = CalculoConsulta.calcular(servicos, produtos, geral);
        return new ConsultaCalculoDto(valores(servicos, r.servicos()), valores(produtos, r.produtos()),
                r.subtotalServicos(), r.subtotalProdutos(), r.subtotal(), r.ajusteGeral(), r.total());
    }

    /**
     * O preço que o catálogo da filial sugere. No antigo a mesma pergunta não
     * filtrava o tenant e respondia sobre o preço de outro cliente.
     */
    @Transactional(readOnly = true)
    public PrecoSugeridoDto preco(UUID filialId, UUID servicoId, UUID produtoId) {
        if ((servicoId == null) == (produtoId == null)) {
            throw new BadRequestException("Informe o serviço ou o produto, um dos dois");
        }
        if (servicoId != null) {
            exigirLeitura(Tela.SERVICOS);
            Servico servico = servicoService.findById(servicoId);
            return new PrecoSugeridoDto(servicoService.valorNaFilial(servico.getId(), filialId).orElse(null),
                    null, null, null);
        }
        exigirLeitura(Tela.PRODUTOS);
        Produto produto = produtoService.findById(produtoId);
        Estoque linha = exigirEstoqueNaFilial(
                estoqueService.linhasNaFilial(List.of(produto.getId()), filialId), produto);
        boolean controla = Boolean.TRUE.equals(linha.getControlaEstoque());
        return new PrecoSugeridoDto(linha.getPrecoVenda(), controla, controla ? linha.getQuantidade() : null,
                produto.getUnidadeMedida().getSigla());
    }

    /** O combo de produto da consulta: só o que tem estoque ativo na filial. */
    @Transactional(readOnly = true)
    public List<ProdutoSelectDto> produtosDaFilial(UUID filialId, String termo) {
        exigirLeitura(Tela.PRODUTOS);
        return estoqueService.daFilial(filialId, termo).stream()
                .map(e -> ProdutoMapper.toSelect(e.getProduto()))
                .toList();
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Escrita
    // ─────────────────────────────────────────────────────────────────────

    @Transactional
    public ConsultaResponseDto create(ConsultaCreateDto dto) {
        exigirAcessoAsListas(dto.servicos(), dto.produtos());
        if ((dto.compromissoId() == null) == (dto.compromisso() == null)) {
            throw new BadRequestException("Informe o compromisso a converter ou os dados de um novo, um dos dois");
        }
        Ajuste.de("geral", dto.tipoAjusteGeral(), dto.tipoCalculoGeral(), dto.valorAjusteGeral());

        Compromisso compromisso;
        if (dto.compromissoId() != null) {
            compromisso = compromissoService.findById(dto.compromissoId());
            if (compromisso.getConsultaId() != null) {
                throw new ConflictException("Este compromisso já é uma consulta");
            }
            CompromissoService.exigirAberto(compromisso);
            if (compromisso.getPessoa() == null) {
                throw new BadRequestException(CompromissoService.SEM_CLIENTE);
            }
        } else {
            if (dto.compromisso().pessoaId() == null) {
                throw new BadRequestException(CompromissoService.SEM_CLIENTE);
            }
            compromisso = compromissoService.criarAvulso(dto.compromisso());
        }

        Consulta c = new Consulta();
        c.setTenant(securityUtils.getTenantReference());
        c.setCompromisso(compromisso);
        c.setObservacao(textoOuNulo(dto.observacao()));
        c.setTipoAjusteGeral(dto.tipoAjusteGeral());
        c.setTipoCalculoGeral(dto.tipoCalculoGeral());
        c.setValorAjusteGeral(dto.valorAjusteGeral());
        c.setCreatedBy(securityUtils.getUsuarioLogado());

        UUID filialId = compromisso.getFilial().getId();
        if (dto.servicos() != null) {
            gravarServicos(c, resolverServicos(dto.servicos(), filialId, List.of()));
        }
        if (dto.produtos() != null) {
            gravarProdutos(c, resolverProdutos(dto.produtos(), filialId, List.of(), false));
        }
        calcular(c);

        Consulta salva = consultaRepository.save(c);
        // O compromisso foi lido antes de a consulta existir: a fórmula ficou vazia
        compromisso.setConsultaId(salva.getId());
        log.info("Consulta criada id={} compromisso={}", salva.getId(), compromisso.getId());
        return responder(salva);
    }

    @Transactional
    public ConsultaResponseDto update(UUID id, ConsultaUpdateDto dto) {
        exigirAcessoAsListas(dto.servicos(), dto.produtos());
        Consulta c = findById(id);
        Compromisso compromisso = c.getCompromisso();
        CompromissoService.exigirAberto(compromisso);
        Ajuste.de("geral", dto.tipoAjusteGeral(), dto.tipoCalculoGeral(), dto.valorAjusteGeral());

        UUID filialAntes = compromisso.getFilial().getId();
        // As mesmas regras da agenda, inclusive o conflito do responsável e o
        // cliente obrigatório — o compromisso é um só
        compromissoService.update(compromisso.getId(), dto.compromisso());
        UUID filialId = compromisso.getFilial().getId();
        boolean filialMudou = !filialAntes.equals(filialId);

        c.setObservacao(textoOuNulo(dto.observacao()));
        c.setTipoAjusteGeral(dto.tipoAjusteGeral());
        c.setTipoCalculoGeral(dto.tipoCalculoGeral());
        c.setValorAjusteGeral(dto.valorAjusteGeral());
        if (dto.servicos() != null) {
            gravarServicos(c, resolverServicos(dto.servicos(), filialId, c.getServicos()));
        }
        if (dto.produtos() != null) {
            gravarProdutos(c, resolverProdutos(dto.produtos(), filialId, c.getProdutos(), filialMudou));
        } else if (filialMudou && !c.getProdutos().isEmpty()) {
            // Quem não vê produtos não os manda, mas a filial nova tem de tê-los
            Map<UUID, Estoque> linhas = estoqueService.linhasNaFilial(
                    c.getProdutos().stream().map(p -> p.getProduto().getId()).collect(Collectors.toSet()), filialId);
            c.getProdutos().forEach(p -> exigirEstoqueNaFilial(linhas, p.getProduto()));
        }
        calcular(c);
        c.setUpdatedBy(securityUtils.getUsuarioLogado());

        log.info("Consulta alterada id={}", id);
        return responder(consultaRepository.save(c));
    }

    @Transactional
    public ConsultaResponseDto iniciar(UUID id) {
        Consulta c = findById(id);
        compromissoService.iniciarAtendimento(c.getCompromisso());
        log.info("Consulta id={} em atendimento", id);
        return responder(c);
    }

    /**
     * Baixa o estoque de cada produto que o controla e encerra o compromisso.
     * Uma transação só: o produto sem saldo recusa com 409 e desfaz as baixas
     * anteriores. Os produtos repetidos somam numa baixa, e as baixas vão em
     * ordem de produto — duas consultas concluídas juntas travam as linhas na
     * mesma ordem, e não uma à outra.
     */
    @Transactional
    public ConsultaResponseDto concluir(UUID id) {
        consultaRepository.travar(id, securityUtils.getTenantIdLogado())
                .orElseThrow(() -> new NotFoundException("Consulta não encontrada"));
        Consulta c = findById(id);
        Compromisso compromisso = c.getCompromisso();
        CompromissoService.exigirAberto(compromisso);

        Map<UUID, BigDecimal> porProduto = new TreeMap<>();
        c.getProdutos().forEach(p -> porProduto.merge(p.getProduto().getId(), p.getQuantidade(), BigDecimal::add));
        UUID filialId = compromisso.getFilial().getId();
        porProduto.forEach((produtoId, quantidade) ->
                estoqueService.saidaPorConsulta(produtoId, filialId, quantidade, c.getId()));

        compromissoService.encerrarAtendimento(compromisso);
        log.info("Consulta concluida id={} produtos={}", id, porProduto.size());
        return responder(c);
    }

    @Transactional
    public ConsultaResponseDto cancelar(UUID id, CancelarCompromissoDto dto) {
        Consulta c = findById(id);
        compromissoService.cancelar(c.getCompromisso().getId(), dto);
        return responder(c);
    }

    @Transactional
    public ConsultaResponseDto faltou(UUID id) {
        Consulta c = findById(id);
        compromissoService.faltou(c.getCompromisso().getId());
        return responder(c);
    }

    /**
     * Uma consulta nova a partir desta: mesma filial e mesmo cliente, o mesmo
     * responsável salvo outro indicado, e os serviços e produtos copiados sem
     * ajuste. O preço é o do catálogo de hoje e, sem ele, o retrato antigo.
     * Só se copia o que ainda se usa: serviço ativo, produto ativo com
     * estoque ativo na filial.
     */
    @Transactional
    public ConsultaResponseDto reconsulta(UUID id, ReconsultaDto dto) {
        Consulta origem = findById(id);
        Compromisso antigo = origem.getCompromisso();
        UUID filialId = antigo.getFilial().getId();

        Compromisso compromisso = compromissoService.criarAvulso(new CompromissoUpdateDto(
                filialId,
                dto.responsavelId() != null ? dto.responsavelId() : antigo.getResponsavel().getId(),
                antigo.getPessoa().getId(),
                antigo.getTitulo(),
                null,
                antigo.getCor(),
                dto.inicio(),
                dto.fim(),
                List.of()));

        Consulta c = new Consulta();
        c.setTenant(securityUtils.getTenantReference());
        c.setCompromisso(compromisso);
        c.setConsultaOrigem(origem);
        c.setCreatedBy(securityUtils.getUsuarioLogado());

        int ordem = 0;
        for (ConsultaServico s : origem.getServicos()) {
            if (!Boolean.TRUE.equals(s.getServico().getAtivo())) continue;
            ConsultaServico novo = new ConsultaServico();
            novo.setServico(s.getServico());
            novo.setDescricao(s.getServico().getNome());
            novo.setQuantidade(s.getQuantidade());
            novo.setPrecoUnitario(servicoService.valorNaFilial(s.getServico().getId(), filialId)
                    .orElse(s.getPrecoUnitario()));
            novo.setOrdem(ordem++);
            prender(c, novo);
            c.getServicos().add(novo);
        }

        Map<UUID, Estoque> linhas = estoqueService.linhasNaFilial(
                origem.getProdutos().stream().map(p -> p.getProduto().getId()).collect(Collectors.toSet()), filialId);
        ordem = 0;
        for (ConsultaProduto p : origem.getProdutos()) {
            Estoque linha = linhas.get(p.getProduto().getId());
            if (!Boolean.TRUE.equals(p.getProduto().getAtivo()) || linha == null
                    || !Boolean.TRUE.equals(linha.getAtivo())) continue;
            ConsultaProduto novo = new ConsultaProduto();
            novo.setProduto(p.getProduto());
            novo.setDescricao(p.getProduto().getNome());
            novo.setQuantidade(p.getQuantidade());
            novo.setPrecoUnitario(linha.getPrecoVenda() != null ? linha.getPrecoVenda() : p.getPrecoUnitario());
            novo.setOrdem(ordem++);
            prender(c, novo);
            c.getProdutos().add(novo);
        }

        Consulta salva = consultaRepository.save(c);
        compromisso.setConsultaId(salva.getId());
        log.info("Reconsulta id={} de {}", salva.getId(), id);
        return responder(salva);
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Itens
    // ─────────────────────────────────────────────────────────────────────

    /** Um item da tela já com a descrição e o preço que vai gravar. */
    private record ServicoResolvido(ConsultaServicoItemDto item, ConsultaServico existente, Servico servico,
                                    String descricao, BigDecimal preco) {}

    private record ProdutoResolvido(ConsultaProdutoItemDto item, ConsultaProduto existente, Produto produto,
                                    String descricao, BigDecimal preco) {}

    /**
     * O item que já estava (mesmo id, mesmo serviço) mantém o retrato da
     * descrição e, sem preço informado, o preço que tinha. O novo precisa de
     * serviço ativo e pega o preço do catálogo da filial quando não vem —
     * nulo e catálogo vazio é 400 nomeando o serviço: vazio não é zero.
     */
    private List<ServicoResolvido> resolverServicos(List<ConsultaServicoItemDto> itens, UUID filialId,
                                                    List<ConsultaServico> gravados) {
        Map<UUID, ConsultaServico> porId = gravados.stream()
                .collect(Collectors.toMap(BaseEntity::getId, Function.identity()));
        Set<UUID> vistos = new HashSet<>();
        List<ServicoResolvido> lista = new ArrayList<>();
        for (ConsultaServicoItemDto item : itens) {
            exigirItemUmaVez(vistos, item.id());
            ConsultaServico existente = item.id() != null ? porId.get(item.id()) : null;
            if (existente != null && existente.getServico().getId().equals(item.servicoId())) {
                lista.add(new ServicoResolvido(item, existente, existente.getServico(), existente.getDescricao(),
                        item.precoUnitario() != null ? item.precoUnitario() : existente.getPrecoUnitario()));
                continue;
            }
            Servico servico = servicoService.findById(item.servicoId());
            if (!Boolean.TRUE.equals(servico.getAtivo())) {
                throw new ConflictException("O serviço " + servico.getNome() + " está inativo");
            }
            BigDecimal preco = item.precoUnitario() != null ? item.precoUnitario()
                    : servicoService.valorNaFilial(servico.getId(), filialId)
                            .orElseThrow(() -> new BadRequestException("Informe o preço de " + servico.getNome()
                                    + ": a filial não tem valor para ele"));
            lista.add(new ServicoResolvido(item, null, servico, servico.getNome(), preco));
        }
        return lista;
    }

    /**
     * Como os serviços, e o produto novo ainda precisa de estoque ativo na
     * filial — o preço sugerido mora lá. Se a filial do compromisso mudou, os
     * que já estavam são conferidos também.
     */
    private List<ProdutoResolvido> resolverProdutos(List<ConsultaProdutoItemDto> itens, UUID filialId,
                                                    List<ConsultaProduto> gravados, boolean filialMudou) {
        Map<UUID, ConsultaProduto> porId = gravados.stream()
                .collect(Collectors.toMap(BaseEntity::getId, Function.identity()));
        Map<UUID, Estoque> linhas = estoqueService.linhasNaFilial(
                itens.stream().map(ConsultaProdutoItemDto::produtoId).collect(Collectors.toSet()), filialId);
        Set<UUID> vistos = new HashSet<>();
        List<ProdutoResolvido> lista = new ArrayList<>();
        for (ConsultaProdutoItemDto item : itens) {
            exigirItemUmaVez(vistos, item.id());
            ConsultaProduto existente = item.id() != null ? porId.get(item.id()) : null;
            if (existente != null && existente.getProduto().getId().equals(item.produtoId())) {
                if (filialMudou) exigirEstoqueNaFilial(linhas, existente.getProduto());
                lista.add(new ProdutoResolvido(item, existente, existente.getProduto(), existente.getDescricao(),
                        item.precoUnitario() != null ? item.precoUnitario() : existente.getPrecoUnitario()));
                continue;
            }
            Produto produto = produtoService.findById(item.produtoId());
            if (!Boolean.TRUE.equals(produto.getAtivo())) {
                throw new ConflictException("O produto " + produto.getNome() + " está inativo");
            }
            Estoque linha = exigirEstoqueNaFilial(linhas, produto);
            BigDecimal preco = item.precoUnitario() != null ? item.precoUnitario() : linha.getPrecoVenda();
            if (preco == null) {
                throw new BadRequestException("Informe o preço de " + produto.getNome()
                        + ": a filial não tem preço de venda para ele");
            }
            lista.add(new ProdutoResolvido(item, null, produto, produto.getNome(), preco));
        }
        return lista;
    }

    private void gravarServicos(Consulta c, List<ServicoResolvido> resolvidos) {
        List<ConsultaServico> nova = new ArrayList<>();
        for (ServicoResolvido r : resolvidos) {
            ConsultaServico s = r.existente();
            if (s == null) {
                s = new ConsultaServico();
                s.setServico(r.servico());
                s.setDescricao(r.descricao());
                prender(c, s);
            }
            s.setQuantidade(r.item().quantidade());
            preencher(s, r.preco(), r.item().tipoAjuste(), r.item().tipoCalculo(), r.item().valorAjuste(),
                    nova.size());
            nova.add(s);
        }
        substituir(c.getServicos(), nova);
    }

    private void gravarProdutos(Consulta c, List<ProdutoResolvido> resolvidos) {
        List<ConsultaProduto> nova = new ArrayList<>();
        for (ProdutoResolvido r : resolvidos) {
            ConsultaProduto p = r.existente();
            if (p == null) {
                p = new ConsultaProduto();
                p.setProduto(r.produto());
                p.setDescricao(r.descricao());
                prender(c, p);
            }
            p.setQuantidade(r.item().quantidade());
            preencher(p, r.preco(), r.item().tipoAjuste(), r.item().tipoCalculo(), r.item().valorAjuste(),
                    nova.size());
            nova.add(p);
        }
        substituir(c.getProdutos(), nova);
    }

    private static void prender(Consulta c, ConsultaItem item) {
        item.setTenant(c.getTenant());
        item.setConsulta(c);
    }

    private static void preencher(ConsultaItem item, BigDecimal preco, TipoAjuste tipo, TipoCalculo calculo,
                                  BigDecimal valor, int ordem) {
        item.setPrecoUnitario(preco);
        item.setTipoAjuste(tipo);
        item.setTipoCalculo(calculo);
        item.setValorAjuste(valor);
        item.setOrdem(ordem);
    }

    /**
     * A coleção passa a ser a lista nova, sem trocar a instância (o
     * {@code orphanRemoval} apaga o que saiu). Sai na ordem da tela.
     */
    private static <T extends ConsultaItem> void substituir(List<T> atual, List<T> nova) {
        atual.removeIf(item -> !nova.contains(item));
        nova.stream().filter(item -> !atual.contains(item)).forEach(atual::add);
        atual.sort(Comparator.comparing(ConsultaItem::getOrdem));
    }

    private static void exigirItemUmaVez(Set<UUID> vistos, UUID id) {
        if (id != null && !vistos.add(id)) {
            throw new BadRequestException("O mesmo item aparece duas vezes na lista");
        }
    }

    private static Estoque exigirEstoqueNaFilial(Map<UUID, Estoque> linhas, Produto produto) {
        Estoque linha = linhas.get(produto.getId());
        if (linha == null || !Boolean.TRUE.equals(linha.getAtivo())) {
            throw new ConflictException(produto.getNome() + " não tem estoque nesta filial");
        }
        return linha;
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Permissão, conta e resposta
    // ─────────────────────────────────────────────────────────────────────

    /** A lista enviada mexe nos itens: sem ler a tela deles, não se mexe. */
    private void exigirAcessoAsListas(List<?> servicos, List<?> produtos) {
        if (servicos != null) exigirLeitura(Tela.SERVICOS);
        if (produtos != null) exigirLeitura(Tela.PRODUTOS);
    }

    private void exigirLeitura(Tela tela) {
        if (!securityUtils.temAuthority(tela.authorityLer())) {
            throw new ForbiddenException("Você não tem acesso a " + tela.rotulo() + " para usá-los na consulta");
        }
    }

    private ConsultaResponseDto responder(Consulta c) {
        boolean veServicos = securityUtils.temAuthority(Tela.SERVICOS.authorityLer());
        boolean veProdutos = securityUtils.temAuthority(Tela.PRODUTOS.authorityLer());
        Map<UUID, Estoque> linhas = veProdutos && !c.getProdutos().isEmpty()
                ? estoqueService.linhasNaFilial(
                        c.getProdutos().stream().map(p -> p.getProduto().getId()).collect(Collectors.toSet()),
                        c.getCompromisso().getFilial().getId())
                : Map.of();
        return ConsultaMapper.toResponse(c, calcular(c), veServicos, veProdutos, linhas);
    }

    /** A conta da consulta como está — e, ao salvar, a guarda dos ajustes contra a base. */
    private static Resultado calcular(Consulta c) {
        return CalculoConsulta.calcular(linhas(c.getServicos()), linhas(c.getProdutos()),
                Ajuste.de("geral", c.getTipoAjusteGeral(), c.getTipoCalculoGeral(), c.getValorAjusteGeral()));
    }

    private static List<Linha> linhas(List<? extends ConsultaItem> itens) {
        return itens.stream()
                .map(i -> linha(i.getDescricao(), i.quantidadeDecimal(), i.getPrecoUnitario(),
                        i.getTipoAjuste(), i.getTipoCalculo(), i.getValorAjuste()))
                .toList();
    }

    private static Linha linha(String descricao, BigDecimal quantidade, BigDecimal preco, TipoAjuste tipo,
                               TipoCalculo calculo, BigDecimal valor) {
        return new Linha(descricao, quantidade, preco, Ajuste.de("de " + descricao, tipo, calculo, valor));
    }

    private static List<ConsultaCalculoDto.Valores> valores(List<Linha> linhas, List<CalculoConsulta.Valores> conta) {
        List<ConsultaCalculoDto.Valores> lista = new ArrayList<>();
        for (int i = 0; i < linhas.size(); i++) {
            CalculoConsulta.Valores v = conta.get(i);
            lista.add(new ConsultaCalculoDto.Valores(linhas.get(i).precoUnitario(), v.subtotal(), v.ajuste(),
                    v.total()));
        }
        return lista;
    }

    private List<Consulta> carregarNaOrdem(List<UUID> ids, UUID tenantId) {
        if (ids.isEmpty()) return List.of();
        Map<UUID, Integer> posicao = ids.stream()
                .collect(Collectors.toMap(Function.identity(), ids::indexOf));
        return consultaRepository.findAllCompletas(ids, tenantId).stream()
                .sorted(Comparator.comparing(c -> posicao.get(c.getId())))
                .toList();
    }

    private static String textoOuNulo(String valor) {
        return valor != null && !valor.isBlank() ? valor.trim() : null;
    }
}
