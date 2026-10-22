package com.api.ero_erp.servico.service;

import com.api.ero_erp.config.PageableUtils;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.exceptions.BadRequestException;
import com.api.ero_erp.exceptions.ConflictException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.filial.entity.Filial;
import com.api.ero_erp.filial.service.FilialService;
import com.api.ero_erp.sequencia.service.SequenciaService;
import com.api.ero_erp.servico.dtos.ServicoCreateDto;
import com.api.ero_erp.servico.dtos.ServicoFilialItemDto;
import com.api.ero_erp.servico.dtos.ServicoResponseDto;
import com.api.ero_erp.servico.dtos.ServicoSelectDto;
import com.api.ero_erp.servico.dtos.ServicoUpdateDto;
import com.api.ero_erp.servico.entity.Servico;
import com.api.ero_erp.servico.entity.ServicoFilial;
import com.api.ero_erp.servico.mapper.ServicoMapper;
import com.api.ero_erp.servico.repository.ServicoFilialRepository;
import com.api.ero_erp.servico.repository.ServicoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Serviços do tenant. No EroErp antigo eram linhas de {@code produto} com
 * classificação SERVICO; aqui têm cadastro próprio, sem estoque, com o valor
 * por filial e um código curto gerado pelo sistema. Ver docs/10.
 *
 * <p>A lista de filiais é o <b>estado completo</b>, como os contatos da
 * pessoa: a filial que veio grava, a que não veio sai. A filial é a chave da
 * linha — não há id de linha a mandar.
 *
 * <p>Logs levam só id e operação (regra 5 do CLAUDE.md).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ServicoService {

    private final ServicoRepository servicoRepository;
    private final ServicoFilialRepository servicoFilialRepository;
    private final FilialService filialService;
    private final SequenciaService sequenciaService;
    private final SecurityUtils securityUtils;

    @Transactional(readOnly = true)
    public Page<ServicoResponseDto> getAll(Pageable pageable, String termo, UUID filialId, Boolean ativo) {
        UUID tenantId = securityUtils.getTenantIdLogado();
        String texto = textoOuNulo(termo);
        Page<UUID> ids = servicoRepository.findIdsWithFilters(
                PageableUtils.semOrdenacao(pageable), tenantId, texto, codigoOuNulo(texto), filialId, ativo);

        List<ServicoResponseDto> linhas = carregarNaOrdem(ids.getContent(), tenantId).stream()
                .map(ServicoMapper::toResponse)
                .toList();
        return new PageImpl<>(linhas, ids.getPageable(), ids.getTotalElements());
    }

    @Transactional(readOnly = true)
    public List<ServicoSelectDto> select(String termo) {
        UUID tenantId = securityUtils.getTenantIdLogado();
        String texto = textoOuNulo(termo);
        List<UUID> ids = servicoRepository.findIdsForSelect(tenantId, texto, codigoOuNulo(texto));
        return carregarNaOrdem(ids, tenantId).stream()
                .map(ServicoMapper::toSelect)
                .toList();
    }

    @Transactional(readOnly = true)
    public ServicoResponseDto findByIdResponse(UUID id) {
        return ServicoMapper.toResponse(findById(id));
    }

    @Transactional(readOnly = true)
    public Servico findById(UUID id) {
        UUID tenantId = securityUtils.getTenantIdLogado();
        return servicoRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new NotFoundException("Serviço não encontrado"));
    }

    /**
     * O valor do serviço numa filial — a sugestão de preço da consulta.
     * Vazio quando a filial não tem linha ou a linha não tem valor: vazio não
     * é zero.
     */
    @Transactional(readOnly = true)
    public Optional<BigDecimal> valorNaFilial(UUID servicoId, UUID filialId) {
        UUID tenantId = securityUtils.getTenantIdLogado();
        return servicoFilialRepository.findByServicoIdAndFilialIdAndTenantId(servicoId, filialId, tenantId)
                .map(ServicoFilial::getValor);
    }

    @Transactional
    public ServicoResponseDto create(ServicoCreateDto dto) {
        UUID tenantId = securityUtils.getTenantIdLogado();
        String nome = dto.nome().trim();
        exigirNomeLivre(tenantId, nome, null);
        exigirFiliaisDistintas(dto.filiais());

        Servico servico = new Servico();
        servico.setTenant(securityUtils.getTenantReference());
        servico.setCodigo(sequenciaService.proximo(tenantId, SequenciaService.SERVICO));
        servico.setNome(nome);
        servico.setObservacao(textoOuNulo(dto.observacao()));
        servico.setCreatedBy(securityUtils.getUsuarioLogado());

        Servico salvo = servicoRepository.save(servico);
        salvo.setFiliais(sincronizarFiliais(salvo, dto.filiais()));

        log.info("Serviço criado id={} codigo={}", salvo.getId(), salvo.getCodigo());
        return ServicoMapper.toResponse(salvo);
    }

    @Transactional
    public ServicoResponseDto update(UUID id, ServicoUpdateDto dto) {
        Servico servico = findById(id);
        String nome = dto.nome().trim();
        // Antes de mexer na entidade: a native do nome descarrega a sessão,
        // e um nome repetido já sujo bateria no índice antes da frase.
        exigirNomeLivre(servico.getTenant().getId(), nome, id);
        exigirFiliaisDistintas(dto.filiais());

        servico.setNome(nome);
        servico.setObservacao(textoOuNulo(dto.observacao()));
        servico.setUpdatedBy(securityUtils.getUsuarioLogado());
        servico.setFiliais(sincronizarFiliais(servico, dto.filiais()));

        log.info("Serviço alterado id={}", id);
        return ServicoMapper.toResponse(servicoRepository.save(servico));
    }

    @Transactional
    public ServicoResponseDto alterarAtivo(UUID id, boolean ativo) {
        Servico servico = findById(id);
        servico.setAtivo(ativo);
        servico.setUpdatedBy(securityUtils.getUsuarioLogado());

        log.info("Serviço {} alterado para ativo={}", id, ativo);
        return ServicoMapper.toResponse(servicoRepository.save(servico));
    }

    // ─────────────────────────────────────────────────────────────────────

    /**
     * Grava a lista de valores por filial e devolve a resultante, para a
     * resposta não sair com a coleção de antes (o serviço já está no contexto
     * de persistência).
     *
     * <p>Filial nova tem de ser do tenant e estar ativa. A que já estava na
     * lista não é reconferida: uma filial inativada depois continua lá, e o
     * valor dela ainda se corrige.
     */
    private List<ServicoFilial> sincronizarFiliais(Servico servico, List<ServicoFilialItemDto> itens) {
        UUID tenantId = servico.getTenant().getId();
        Map<UUID, ServicoFilial> existentes = servico.getId() == null ? Map.of()
                : servicoFilialRepository.findAllByServicoIdAndTenantId(servico.getId(), tenantId).stream()
                        .collect(Collectors.toMap(l -> l.getFilial().getId(), Function.identity()));
        List<ServicoFilialItemDto> lista = itens != null ? itens : List.of();

        Set<UUID> recebidas = lista.stream().map(ServicoFilialItemDto::filialId).collect(Collectors.toSet());
        List<ServicoFilial> ausentes = existentes.values().stream()
                .filter(l -> !recebidas.contains(l.getFilial().getId()))
                .toList();
        servicoFilialRepository.deleteAll(ausentes);

        List<ServicoFilial> resultado = new ArrayList<>();
        for (ServicoFilialItemDto item : lista) {
            ServicoFilial linha = existentes.get(item.filialId());
            if (linha == null) {
                linha = new ServicoFilial();
                linha.setTenant(servico.getTenant());
                linha.setServico(servico);
                linha.setFilial(exigirFilialAtiva(item.filialId()));
            }
            linha.setValor(item.valor());
            resultado.add(servicoFilialRepository.save(linha));
        }
        return resultado;
    }

    private Filial exigirFilialAtiva(UUID filialId) {
        Filial filial = filialService.findById(filialId);
        if (!Boolean.TRUE.equals(filial.getAtivo())) {
            throw new ConflictException("A filial " + filial.getPessoa().getNome()
                    + " está inativa. Reative-a antes de dar valor a ela");
        }
        return filial;
    }

    private static void exigirFiliaisDistintas(List<ServicoFilialItemDto> itens) {
        if (itens == null) return;
        Set<UUID> vistas = new HashSet<>();
        for (ServicoFilialItemDto item : itens) {
            if (!vistas.add(item.filialId())) {
                throw new BadRequestException("Cada filial entra uma vez só na lista de valores");
            }
        }
    }

    private void exigirNomeLivre(UUID tenantId, String nome, UUID ignorarId) {
        if (servicoRepository.existeNome(tenantId, nome, ignorarId)) {
            throw new ConflictException("Já existe um serviço com o nome \"" + nome + "\"");
        }
    }

    private List<Servico> carregarNaOrdem(List<UUID> ids, UUID tenantId) {
        if (ids.isEmpty()) return List.of();
        Map<UUID, Integer> posicao = ids.stream()
                .collect(Collectors.toMap(Function.identity(), ids::indexOf));
        return servicoRepository.findAllComFiliais(ids, tenantId).stream()
                .sorted(Comparator.comparing(s -> posicao.get(s.getId())))
                .toList();
    }

    /** O termo como código, quando é só dígitos e cabe num long. */
    private static Long codigoOuNulo(String termo) {
        if (termo == null || !termo.matches("\\d{1,18}")) return null;
        return Long.parseLong(termo);
    }

    private static String textoOuNulo(String valor) {
        return valor != null && !valor.isBlank() ? valor.trim() : null;
    }
}
