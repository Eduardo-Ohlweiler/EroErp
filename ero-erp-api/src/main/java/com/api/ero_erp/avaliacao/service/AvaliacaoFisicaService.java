package com.api.ero_erp.avaliacao.service;

import com.api.ero_erp.avaliacao.dto.*;
import com.api.ero_erp.avaliacao.entity.AvaliacaoFisica;
import com.api.ero_erp.avaliacao.entity.ComposicaoCorporal;
import com.api.ero_erp.avaliacao.entity.MedidaCorporal;
import com.api.ero_erp.avaliacao.repository.AvaliacaoFisicaRepository;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.usuario.service.UsuarioService;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.pessoa.service.PessoaService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
public class AvaliacaoFisicaService {

    private final AvaliacaoFisicaRepository repository;
    private final PessoaService             pessoaService;
    private final UsuarioService            usuarioService;
    private final SecurityUtils             securityUtils;

    public AvaliacaoFisicaService(
            AvaliacaoFisicaRepository repository,
            PessoaService             pessoaService,
            UsuarioService            usuarioService,
            SecurityUtils             securityUtils
    ) {
        this.repository     = repository;
        this.pessoaService  = pessoaService;
        this.usuarioService = usuarioService;
        this.securityUtils  = securityUtils;
    }

    // ── Leitura ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<AvaliacaoFisicaSummaryDto> getAll(
            Pageable  pageable,
            Long      pessoaId,
            LocalDate dataInicio,
            LocalDate dataFim
    ) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findAllWithFilters(pageable, clienteId, pessoaId, dataInicio, dataFim)
                .map(this::toSummaryDto);
    }

    @Transactional(readOnly = true)
    public AvaliacaoFisicaResponseDto findByIdResponse(Long id) {
        Long            clienteId = securityUtils.getClienteIdLogado();
        AvaliacaoFisica avaliacao = repository.findByIdWithDetails(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Avaliação física não encontrada, verifique!"));
        return toResponseDto(avaliacao);
    }

    @Transactional(readOnly = true)
    public List<AvaliacaoFisicaSummaryDto> getEvolucao(Long pessoaId) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findEvolucaoByPessoa(clienteId, pessoaId)
                .stream()
                .map(this::toSummaryDto)
                .toList();
    }

    // ── Escrita ───────────────────────────────────────────────────────────────

    @Transactional
    public AvaliacaoFisicaResponseDto create(AvaliacaoFisicaCreateDto dto) {
        Cliente cliente  = securityUtils.getClienteLogado();
        Pessoa  pessoa   = pessoaService.findById(dto.pessoaId());
        Usuario usuario  = dto.usuarioId() != null ? usuarioService.findByIdAndClienteId(dto.usuarioId()) : null;

        AvaliacaoFisica avaliacao = new AvaliacaoFisica();
        avaliacao.setCliente(cliente);
        avaliacao.setPessoa(pessoa);
        avaliacao.setUsuario(usuario);
        avaliacao.setDataAvaliacao(dto.dataAvaliacao());
        avaliacao.setPeso(dto.peso());
        avaliacao.setAltura(dto.altura());
        avaliacao.setImc(calcularImc(dto.peso(), dto.altura()));
        avaliacao.setIdade(dto.idade());
        avaliacao.setSexo(dto.sexo());
        avaliacao.setObjetivo(dto.objetivo());
        avaliacao.setMetaDescricao(dto.metaDescricao());
        avaliacao.setPesoAlvo(dto.pesoAlvo());
        avaliacao.setObservacoes(dto.observacoes());

        if (dto.medidas() != null) {
            for (MedidaCorporalDto m : dto.medidas()) {
                MedidaCorporal medida = new MedidaCorporal();
                medida.setCliente(cliente);
                medida.setAvaliacao(avaliacao);
                medida.setPontoMedicao(m.pontoMedicao());
                medida.setValorCm(m.valorCm());
                avaliacao.getMedidas().add(medida);
            }
        }

        if (dto.composicao() != null) {
            ComposicaoCorporal composicao = buildComposicao(cliente, avaliacao, dto.composicao());
            avaliacao.setComposicao(composicao);
        }

        return toResponseDto(repository.save(avaliacao));
    }

    @Transactional
    public AvaliacaoFisicaResponseDto update(Long id, AvaliacaoFisicaUpdateDto dto) {
        Long            clienteId = securityUtils.getClienteIdLogado();
        Cliente         cliente   = securityUtils.getClienteLogado();
        AvaliacaoFisica avaliacao = repository.findByIdWithDetails(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Avaliação física não encontrada, verifique!"));

        if (dto.pessoaId() != null)      avaliacao.setPessoa(pessoaService.findById(dto.pessoaId()));
        if (dto.usuarioId() != null)     avaliacao.setUsuario(usuarioService.findByIdAndClienteId(dto.usuarioId()));
        if (dto.dataAvaliacao() != null) avaliacao.setDataAvaliacao(dto.dataAvaliacao());
        if (dto.peso() != null)          avaliacao.setPeso(dto.peso());
        if (dto.altura() != null)        avaliacao.setAltura(dto.altura());
        if (dto.idade() != null)         avaliacao.setIdade(dto.idade());
        if (dto.sexo() != null)          avaliacao.setSexo(dto.sexo());
        if (dto.objetivo() != null)      avaliacao.setObjetivo(dto.objetivo());
        if (dto.metaDescricao() != null) avaliacao.setMetaDescricao(dto.metaDescricao());
        if (dto.pesoAlvo() != null)      avaliacao.setPesoAlvo(dto.pesoAlvo());
        if (dto.observacoes() != null)   avaliacao.setObservacoes(dto.observacoes());
        if (dto.ativo() != null)         avaliacao.setAtivo(dto.ativo());

        if (avaliacao.getPeso() != null && avaliacao.getAltura() != null) {
            avaliacao.setImc(calcularImc(avaliacao.getPeso(), avaliacao.getAltura()));
        }

        if (dto.medidas() != null) {
            avaliacao.getMedidas().clear();
            for (MedidaCorporalDto m : dto.medidas()) {
                MedidaCorporal medida = new MedidaCorporal();
                medida.setCliente(cliente);
                medida.setAvaliacao(avaliacao);
                medida.setPontoMedicao(m.pontoMedicao());
                medida.setValorCm(m.valorCm());
                avaliacao.getMedidas().add(medida);
            }
        }

        if (dto.composicao() != null) {
            if (avaliacao.getComposicao() != null) {
                applyComposicao(avaliacao.getComposicao(), dto.composicao());
            } else {
                avaliacao.setComposicao(buildComposicao(cliente, avaliacao, dto.composicao()));
            }
        }

        return toResponseDto(repository.save(avaliacao));
    }

    @Transactional
    public void delete(Long id) {
        Long            clienteId = securityUtils.getClienteIdLogado();
        AvaliacaoFisica avaliacao = repository.findByIdWithDetails(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Avaliação física não encontrada, verifique!"));
        repository.delete(avaliacao);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private BigDecimal calcularImc(BigDecimal peso, BigDecimal altura) {
        if (peso == null || altura == null || altura.compareTo(BigDecimal.ZERO) == 0) return null;
        BigDecimal alturaM = altura.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
        return peso.divide(alturaM.multiply(alturaM), 2, RoundingMode.HALF_UP);
    }

    private ComposicaoCorporal buildComposicao(Cliente cliente, AvaliacaoFisica avaliacao, ComposicaoCorporalDto dto) {
        ComposicaoCorporal c = new ComposicaoCorporal();
        c.setCliente(cliente);
        c.setAvaliacao(avaliacao);
        applyComposicao(c, dto);
        return c;
    }

    private void applyComposicao(ComposicaoCorporal c, ComposicaoCorporalDto dto) {
        if (dto.percentualGordura() != null)    c.setPercentualGordura(dto.percentualGordura());
        if (dto.massaMuscularKg() != null)      c.setMassaMuscularKg(dto.massaMuscularKg());
        if (dto.massaGordaKg() != null)         c.setMassaGordaKg(dto.massaGordaKg());
        if (dto.massaOsseaKg() != null)         c.setMassaOsseaKg(dto.massaOsseaKg());
        if (dto.aguaCorporalPercentual() != null) c.setAguaCorporalPercentual(dto.aguaCorporalPercentual());
        if (dto.metabolismoBasal() != null)     c.setMetabolismoBasal(dto.metabolismoBasal());
        if (dto.idadeMetabolica() != null)      c.setIdadeMetabolica(dto.idadeMetabolica());
    }

    private AvaliacaoFisicaResponseDto toResponseDto(AvaliacaoFisica a) {
        return new AvaliacaoFisicaResponseDto(
                a.getId(),
                a.getPessoa().getId(),
                a.getPessoa().getNome(),
                a.getUsuario() != null ? a.getUsuario().getId() : null,
                a.getUsuario() != null ? a.getUsuario().getNome() : null,
                a.getDataAvaliacao(),
                a.getPeso(),
                a.getAltura(),
                a.getImc(),
                a.getIdade(),
                a.getSexo(),
                a.getObjetivo(),
                a.getMetaDescricao(),
                a.getPesoAlvo(),
                a.getObservacoes(),
                a.isAtivo(),
                a.getMedidas().stream().map(m ->
                        new MedidaCorporalResponseDto(m.getId(), m.getPontoMedicao(), m.getValorCm())
                ).toList(),
                a.getComposicao() != null ? toComposicaoDto(a.getComposicao()) : null,
                a.getCreatedAt(),
                a.getUpdatedAt()
        );
    }

    private AvaliacaoFisicaSummaryDto toSummaryDto(AvaliacaoFisica a) {
        return new AvaliacaoFisicaSummaryDto(
                a.getId(),
                a.getPessoa().getId(),
                a.getPessoa().getNome(),
                a.getDataAvaliacao(),
                a.getPeso(),
                a.getAltura(),
                a.getImc(),
                a.getIdade(),
                a.getSexo(),
                a.getObjetivo(),
                a.getMetaDescricao(),
                a.getPesoAlvo(),
                a.isAtivo(),
                a.getMedidas().stream().map(m ->
                        new MedidaCorporalResponseDto(m.getId(), m.getPontoMedicao(), m.getValorCm())
                ).toList(),
                a.getComposicao() != null ? toComposicaoDto(a.getComposicao()) : null
        );
    }

    private ComposicaoCorporalResponseDto toComposicaoDto(ComposicaoCorporal c) {
        return new ComposicaoCorporalResponseDto(
                c.getId(),
                c.getPercentualGordura(),
                c.getMassaMuscularKg(),
                c.getMassaGordaKg(),
                c.getMassaOsseaKg(),
                c.getAguaCorporalPercentual(),
                c.getMetabolismoBasal(),
                c.getIdadeMetabolica()
        );
    }
}
