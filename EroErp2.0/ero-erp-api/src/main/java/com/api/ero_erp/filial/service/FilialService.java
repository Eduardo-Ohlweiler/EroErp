package com.api.ero_erp.filial.service;

import com.api.ero_erp.config.PageableUtils;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.exceptions.BadRequestException;
import com.api.ero_erp.exceptions.ConflictException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.filial.dtos.FilialCreateDto;
import com.api.ero_erp.filial.dtos.FilialResponseDto;
import com.api.ero_erp.filial.dtos.FilialSelectDto;
import com.api.ero_erp.filial.dtos.FilialUpdateDto;
import com.api.ero_erp.filial.entity.Filial;
import com.api.ero_erp.filial.enums.TipoFilial;
import com.api.ero_erp.filial.mapper.FilialMapper;
import com.api.ero_erp.filial.repository.FilialRepository;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.pessoa.service.PessoaService;
import com.api.ero_erp.pessoa.util.PessoaValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Filiais do tenant — redesenho do {@code EmitenteService} do EroErp antigo.
 *
 * <p>O antigo deixava a matriz ser qualquer pessoa (até a própria), usava um
 * emitente bloqueado por toda parte fora do combo e apagava com delete
 * físico. Aqui a matriz é uma filial {@code MATRIZ} ativa do mesmo tenant, e
 * nada se apaga: inativa-se. Várias matrizes por tenant são permitidas —
 * negócios separados do mesmo cliente. Ver docs/09.
 *
 * <p>Logs levam só id e operação (regra 5 do CLAUDE.md).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FilialService {

    private final FilialRepository filialRepository;
    private final PessoaService pessoaService;
    private final SecurityUtils securityUtils;

    @Transactional(readOnly = true)
    public Page<FilialResponseDto> getAll(Pageable pageable, String nome, String documento,
                                          TipoFilial tipo, Boolean ativo) {
        UUID tenantId = securityUtils.getTenantIdLogado();
        Page<UUID> ids = filialRepository.findIdsWithFilters(
                PageableUtils.semOrdenacao(pageable),
                tenantId,
                textoOuNulo(nome),
                PessoaValidator.somenteDigitosOuNulo(documento),
                tipo != null ? tipo.name() : null,
                ativo);

        List<FilialResponseDto> linhas = carregarNaOrdem(ids.getContent(), tenantId).stream()
                .map(FilialMapper::toResponse)
                .toList();
        return new PageImpl<>(linhas, ids.getPageable(), ids.getTotalElements());
    }

    @Transactional(readOnly = true)
    public List<FilialSelectDto> select(String termo, TipoFilial tipo, UUID ignorarId) {
        UUID tenantId = securityUtils.getTenantIdLogado();
        List<UUID> ids = filialRepository.findIdsForSelect(
                tenantId, textoOuNulo(termo), tipo != null ? tipo.name() : null, ignorarId);
        return carregarNaOrdem(ids, tenantId).stream()
                .map(FilialMapper::toSelect)
                .toList();
    }

    @Transactional(readOnly = true)
    public FilialResponseDto findByIdResponse(UUID id) {
        return FilialMapper.toResponse(findById(id));
    }

    @Transactional(readOnly = true)
    public Filial findById(UUID id) {
        UUID tenantId = securityUtils.getTenantIdLogado();
        return filialRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new NotFoundException("Filial não encontrada"));
    }

    @Transactional
    public FilialResponseDto create(FilialCreateDto dto) {
        UUID tenantId = securityUtils.getTenantIdLogado();

        Pessoa pessoa = exigirPessoaLivre(dto.pessoaId(), tenantId, null);
        Filial matriz = resolverMatriz(dto.tipo(), dto.matrizId(), null);

        Filial filial = new Filial();
        filial.setTenant(securityUtils.getTenantReference());
        filial.setPessoa(pessoa);
        filial.setTipo(dto.tipo());
        filial.setMatriz(matriz);
        filial.setCor(normalizarCor(dto.cor()));
        filial.setCreatedBy(securityUtils.getUsuarioLogado());

        Filial salva = filialRepository.save(filial);
        log.info("Filial criada id={} tipo={}", salva.getId(), salva.getTipo());
        return FilialMapper.toResponse(salva);
    }

    @Transactional
    public FilialResponseDto update(UUID id, FilialUpdateDto dto) {
        Filial filial = findById(id);
        UUID tenantId = filial.getTenant().getId();

        if (!filial.getPessoa().getId().equals(dto.pessoaId())) {
            filial.setPessoa(exigirPessoaLivre(dto.pessoaId(), tenantId, id));
        }

        // Matriz que vira filial deixaria as dela respondendo a uma filial.
        if (filial.ehMatriz() && dto.tipo() == TipoFilial.FILIAL && filialRepository.existsByMatrizId(id)) {
            throw new ConflictException(
                    "Esta matriz tem filiais. Mude a matriz delas antes de transformá-la em filial");
        }

        // A matriz que já estava não é reconferida: uma filial inativa de
        // matriz inativa ainda pode ter a cor corrigida.
        Filial matrizAtual = filial.getMatriz();
        boolean mesmaMatriz = dto.tipo() == TipoFilial.FILIAL && matrizAtual != null
                && matrizAtual.getId().equals(dto.matrizId());
        filial.setMatriz(mesmaMatriz ? matrizAtual : resolverMatriz(dto.tipo(), dto.matrizId(), id));
        filial.setTipo(dto.tipo());
        filial.setCor(normalizarCor(dto.cor()));
        filial.setUpdatedBy(securityUtils.getUsuarioLogado());

        log.info("Filial alterada id={} tipo={}", id, filial.getTipo());
        return FilialMapper.toResponse(filialRepository.save(filial));
    }

    @Transactional
    public FilialResponseDto alterarAtivo(UUID id, boolean ativo) {
        Filial filial = findById(id);

        if (!ativo && filial.ehMatriz()) {
            long ativas = filialRepository.countByMatrizIdAndAtivoTrue(id);
            if (ativas > 0) {
                throw new ConflictException(ativas == 1
                        ? "Esta matriz tem 1 filial ativa. Inative-a antes"
                        : "Esta matriz tem " + ativas + " filiais ativas. Inative-as antes");
            }
        }
        if (ativo && !filial.ehMatriz() && !filial.getMatriz().getAtivo()) {
            throw new ConflictException("A matriz desta filial está inativa. Reative a matriz antes");
        }

        filial.setAtivo(ativo);
        filial.setUpdatedBy(securityUtils.getUsuarioLogado());

        log.info("Filial {} alterada para ativo={}", id, ativo);
        return FilialMapper.toResponse(filialRepository.save(filial));
    }

    // ─────────────────────────────────────────────────────────────────────

    /** A pessoa existe no tenant, está ativa e não é outra filial. */
    private Pessoa exigirPessoaLivre(UUID pessoaId, UUID tenantId, UUID ignorarFilialId) {
        Pessoa pessoa = pessoaService.findById(pessoaId);
        if (!Boolean.TRUE.equals(pessoa.getAtivo())) {
            throw new ConflictException("Pessoa inativa não pode ser filial");
        }
        boolean emUso = ignorarFilialId == null
                ? filialRepository.existsByTenantIdAndPessoaId(tenantId, pessoaId)
                : filialRepository.existsByTenantIdAndPessoaIdAndIdNot(tenantId, pessoaId, ignorarFilialId);
        if (emUso) {
            throw new ConflictException("Esta pessoa já é uma filial");
        }
        return pessoa;
    }

    /**
     * A matriz que o tipo pede: nenhuma na {@code MATRIZ}; na {@code FILIAL},
     * uma matriz ativa do tenant que não seja ela mesma.
     */
    private Filial resolverMatriz(TipoFilial tipo, UUID matrizId, UUID propriaId) {
        if (tipo == TipoFilial.MATRIZ) {
            if (matrizId != null) {
                throw new BadRequestException("Matriz não responde a outra matriz. Deixe a matriz em branco");
            }
            return null;
        }
        if (matrizId == null) {
            throw new BadRequestException("Informe a matriz desta filial");
        }
        if (matrizId.equals(propriaId)) {
            throw new BadRequestException("A filial não pode ser a própria matriz");
        }
        Filial matriz = filialRepository.findByIdAndTenantId(matrizId, securityUtils.getTenantIdLogado())
                .orElseThrow(() -> new NotFoundException("Matriz não encontrada"));
        if (!matriz.ehMatriz()) {
            throw new ConflictException("A matriz escolhida é uma filial. Escolha uma matriz");
        }
        if (!Boolean.TRUE.equals(matriz.getAtivo())) {
            throw new ConflictException("A matriz escolhida está inativa");
        }
        return matriz;
    }

    private List<Filial> carregarNaOrdem(List<UUID> ids, UUID tenantId) {
        if (ids.isEmpty()) return List.of();
        Map<UUID, Integer> posicao = ids.stream()
                .collect(Collectors.toMap(Function.identity(), ids::indexOf));
        return filialRepository.findAllComPessoa(ids, tenantId).stream()
                .sorted(Comparator.comparing(f -> posicao.get(f.getId())))
                .toList();
    }

    private static String normalizarCor(String cor) {
        return cor.trim().toUpperCase(Locale.ROOT);
    }

    private static String textoOuNulo(String valor) {
        return valor != null && !valor.isBlank() ? valor.trim() : null;
    }
}
