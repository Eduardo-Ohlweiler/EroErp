package com.api.ero_erp.otorrino.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.clinica.entity.Consulta;
import com.api.ero_erp.clinica.service.ConsultaService;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.otorrino.dto.AudiometriaCreateDto;
import com.api.ero_erp.otorrino.dto.AudiometriaLimiarDto;
import com.api.ero_erp.otorrino.dto.AudiometriaResponseDto;
import com.api.ero_erp.otorrino.dto.AudiometriaSummaryDto;
import com.api.ero_erp.otorrino.dto.AudiometriaUpdateDto;
import com.api.ero_erp.otorrino.entity.Audiometria;
import com.api.ero_erp.otorrino.entity.AudiometriaLimiar;
import com.api.ero_erp.otorrino.enums.GrauPerdaAuditiva;
import com.api.ero_erp.otorrino.enums.OrelhaEnum;
import com.api.ero_erp.otorrino.enums.TipoPerdaAuditiva;
import com.api.ero_erp.otorrino.enums.ViaEnum;
import com.api.ero_erp.otorrino.mapper.AudiometriaMapper;
import com.api.ero_erp.otorrino.repository.AudiometriaRepository;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.pessoa.service.PessoaService;
import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.usuario.service.UsuarioService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
public class AudiometriaService {

    /** Frequências (Hz) usadas no cálculo da média tonal — média quadritonal (500/1000/2000/4000). */
    private static final List<Integer> FREQ_MEDIA = List.of(500, 1000, 2000, 4000);

    /** Limiar (dB) até onde a audição é considerada normal (OMS). */
    private static final BigDecimal LIMITE_NORMAL = BigDecimal.valueOf(25);

    /** Gap aéreo-ósseo (dB) a partir do qual há componente condutivo relevante. */
    private static final BigDecimal GAP_CONDUTIVO = BigDecimal.valueOf(15);

    private static final String NORMA_PADRAO = "OMS";

    private final AudiometriaRepository repository;
    private final PessoaService         pessoaService;
    private final UsuarioService        usuarioService;
    private final ConsultaService       consultaService;
    private final SecurityUtils         securityUtils;

    public AudiometriaService(
            AudiometriaRepository repository,
            PessoaService         pessoaService,
            UsuarioService        usuarioService,
            ConsultaService       consultaService,
            SecurityUtils         securityUtils
    ) {
        this.repository      = repository;
        this.pessoaService   = pessoaService;
        this.usuarioService  = usuarioService;
        this.consultaService = consultaService;
        this.securityUtils   = securityUtils;
    }

    // ── Leitura ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<AudiometriaSummaryDto> getAll(
            Pageable  pageable,
            Long      pessoaId,
            LocalDate dataInicio,
            LocalDate dataFim,
            String    nome
    ) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findAllWithFilters(pageable, clienteId, pessoaId, dataInicio, dataFim, nome)
                .map(AudiometriaMapper::toSummaryDto);
    }

    @Transactional(readOnly = true)
    public Audiometria findById(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Audiometria não encontrada, verifique!"));
    }

    @Transactional(readOnly = true)
    public AudiometriaResponseDto getResponseById(Long id) {
        return AudiometriaMapper.toResponseDto(findById(id));
    }

    @Transactional(readOnly = true)
    public List<AudiometriaSummaryDto> getByPessoa(Long pessoaId) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findByPessoaIdAndClienteId(pessoaId, clienteId).stream()
                .map(AudiometriaMapper::toSummaryDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AudiometriaSummaryDto> getByConsulta(Long consultaId) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findByConsultaIdAndClienteId(consultaId, clienteId).stream()
                .map(AudiometriaMapper::toSummaryDto)
                .toList();
    }

    // ── Escrita ─────────────────────────────────────────────────────────────

    @Transactional
    public AudiometriaResponseDto create(AudiometriaCreateDto dto) {
        Cliente cliente = securityUtils.getClienteLogado();
        Pessoa  pessoa  = pessoaService.findById(dto.pessoaId());

        Audiometria audiometria = new Audiometria();
        audiometria.setCliente(cliente);
        audiometria.setPessoa(pessoa);
        audiometria.setUsuario(resolveUsuario(dto.usuarioId()));
        audiometria.setConsulta(resolveConsulta(dto.consultaId()));
        audiometria.setDataExame(dto.dataExame());
        audiometria.setSrtOdDb(dto.srtOdDb());
        audiometria.setSrtOeDb(dto.srtOeDb());
        audiometria.setIrfOdPerc(dto.irfOdPerc());
        audiometria.setIrfOePerc(dto.irfOePerc());
        audiometria.setNorma(dto.norma() != null ? dto.norma() : NORMA_PADRAO);
        audiometria.setObservacao(dto.observacao());

        sincronizarLimiares(audiometria, dto.limiares());
        calcularSnapshot(audiometria);

        return AudiometriaMapper.toResponseDto(repository.save(audiometria));
    }

    @Transactional
    public AudiometriaResponseDto update(Long id, AudiometriaUpdateDto dto) {
        Long        clienteId   = securityUtils.getClienteIdLogado();
        Audiometria audiometria = repository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Audiometria não encontrada, verifique!"));

        if (dto.pessoaId() != null)   audiometria.setPessoa(pessoaService.findById(dto.pessoaId()));
        if (dto.usuarioId() != null)  audiometria.setUsuario(resolveUsuario(dto.usuarioId()));
        if (dto.consultaId() != null) audiometria.setConsulta(resolveConsulta(dto.consultaId()));
        if (dto.dataExame() != null)  audiometria.setDataExame(dto.dataExame());
        if (dto.srtOdDb() != null)    audiometria.setSrtOdDb(dto.srtOdDb());
        if (dto.srtOeDb() != null)    audiometria.setSrtOeDb(dto.srtOeDb());
        if (dto.irfOdPerc() != null)  audiometria.setIrfOdPerc(dto.irfOdPerc());
        if (dto.irfOePerc() != null)  audiometria.setIrfOePerc(dto.irfOePerc());
        if (dto.norma() != null)      audiometria.setNorma(dto.norma());
        if (dto.observacao() != null) audiometria.setObservacao(dto.observacao());

        // Quando a lista de limiares é informada, ela substitui integralmente a coleção atual.
        if (dto.limiares() != null) {
            sincronizarLimiares(audiometria, dto.limiares());
        }

        calcularSnapshot(audiometria);

        return AudiometriaMapper.toResponseDto(repository.save(audiometria));
    }

    /**
     * Vincula (ou desvincula, quando {@code consultaId} é nulo) a audiometria a uma consulta,
     * sem tocar nos limiares nem recalcular o snapshot.
     */
    @Transactional
    public AudiometriaResponseDto vincularConsulta(Long audiometriaId, Long consultaId) {
        Long        clienteId   = securityUtils.getClienteIdLogado();
        Audiometria audiometria = repository.findByIdAndClienteId(audiometriaId, clienteId)
                .orElseThrow(() -> new NotFoundException("Audiometria não encontrada, verifique!"));

        audiometria.setConsulta(resolveConsulta(consultaId));

        return AudiometriaMapper.toResponseDto(repository.save(audiometria));
    }

    @Transactional
    public void delete(Long id) {
        Long        clienteId   = securityUtils.getClienteIdLogado();
        Audiometria audiometria = repository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Audiometria não encontrada, verifique!"));
        repository.delete(audiometria);
    }

    // ── Helpers de carga ──────────────────────────────────────────────────────

    private Usuario resolveUsuario(Long usuarioId) {
        Long id = usuarioId != null ? usuarioId : securityUtils.getUsuarioIdLogado();
        if (id == null) return null;
        return usuarioService.findByIdAndClienteId(id);
    }

    private Consulta resolveConsulta(Long consultaId) {
        if (consultaId == null) return null;
        // ConsultaService.findById já valida o cliente logado.
        return consultaService.findById(consultaId);
    }

    /** Recria a coleção de limiares (orphanRemoval remove os antigos). */
    private void sincronizarLimiares(Audiometria audiometria, List<AudiometriaLimiarDto> limiares) {
        audiometria.clearLimiares();
        if (limiares == null) return;
        for (AudiometriaLimiarDto dto : limiares) {
            AudiometriaLimiar limiar = new AudiometriaLimiar();
            limiar.setOrelha(dto.orelha());
            limiar.setVia(dto.via());
            limiar.setFrequencia(dto.frequencia());
            limiar.setLimiarDb(dto.limiarDb());
            limiar.setMascarado(dto.mascarado());
            limiar.setSemResposta(dto.semResposta());
            audiometria.addLimiar(limiar);
        }
    }

    // ── Cálculo do snapshot (fonte da verdade) ─────────────────────────────────

    /**
     * Calcula e grava o snapshot de resultados a partir dos limiares.
     *
     * <p>Média tonal: média aritmética dos limiares de via AÉREA nas frequências
     * 500/1000/2000/4000 Hz (média quadritonal). Pontos null ou "sem resposta" são
     * ignorados; se faltar alguma das 4, calcula-se com as disponíveis; se nenhuma,
     * a média fica null.</p>
     *
     * <p>Grau (OMS, pela média aérea): ≤25 NORMAL · 26–40 LEVE · 41–60 MODERADA ·
     * 61–80 SEVERA · &gt;80 PROFUNDA.</p>
     *
     * <p>Tipo de perda (compara média aérea vs média óssea, mesmas frequências):</p>
     * <ul>
     *   <li>média aérea ≤25 → NORMAL;</li>
     *   <li>sem dados ósseos → assume NEUROSSENSORIAL (não há como medir o gap);</li>
     *   <li>gap (aérea − óssea) ≥15 e óssea ≤25 → CONDUTIVA;</li>
     *   <li>gap ≥15 e óssea &gt;25 (óssea também alterada) → MISTA;</li>
     *   <li>gap &lt;15 (aérea e óssea alteradas juntas) → NEUROSSENSORIAL.</li>
     * </ul>
     */
    private void calcularSnapshot(Audiometria a) {
        if (a.getNorma() == null) {
            a.setNorma(NORMA_PADRAO);
        }

        BigDecimal mediaAereaOd = mediaQuadritonal(a, OrelhaEnum.OD, ViaEnum.AEREA);
        BigDecimal mediaAereaOe = mediaQuadritonal(a, OrelhaEnum.OE, ViaEnum.AEREA);
        BigDecimal mediaOsseaOd = mediaQuadritonal(a, OrelhaEnum.OD, ViaEnum.OSSEA);
        BigDecimal mediaOsseaOe = mediaQuadritonal(a, OrelhaEnum.OE, ViaEnum.OSSEA);

        a.setMediaOd(mediaAereaOd);
        a.setMediaOe(mediaAereaOe);
        a.setGrauOd(classificarGrau(mediaAereaOd));
        a.setGrauOe(classificarGrau(mediaAereaOe));
        a.setTipoPerdaOd(classificarTipo(mediaAereaOd, mediaOsseaOd));
        a.setTipoPerdaOe(classificarTipo(mediaAereaOe, mediaOsseaOe));
    }

    /** Média aritmética dos limiares válidos (via informada) nas frequências 500/1000/2000/4000. */
    private BigDecimal mediaQuadritonal(Audiometria a, OrelhaEnum orelha, ViaEnum via) {
        List<Integer> valores = a.getLimiares().stream()
                .filter(l -> l.getOrelha() == orelha)
                .filter(l -> l.getVia() == via)
                .filter(l -> FREQ_MEDIA.contains(l.getFrequencia()))
                .filter(l -> !l.isSemResposta())
                .map(AudiometriaLimiar::getLimiarDb)
                .filter(java.util.Objects::nonNull)
                .toList();

        if (valores.isEmpty()) return null;

        int soma = valores.stream().mapToInt(Integer::intValue).sum();
        return BigDecimal.valueOf(soma)
                .divide(BigDecimal.valueOf(valores.size()), 2, RoundingMode.HALF_UP);
    }

    private GrauPerdaAuditiva classificarGrau(BigDecimal media) {
        if (media == null) return null;
        double m = media.doubleValue();
        if (m <= 25) return GrauPerdaAuditiva.NORMAL;
        if (m <= 40) return GrauPerdaAuditiva.LEVE;
        if (m <= 60) return GrauPerdaAuditiva.MODERADA;
        if (m <= 80) return GrauPerdaAuditiva.SEVERA;
        return GrauPerdaAuditiva.PROFUNDA;
    }

    private TipoPerdaAuditiva classificarTipo(BigDecimal mediaAerea, BigDecimal mediaOssea) {
        if (mediaAerea == null) return null;

        // Audição aérea dentro da normalidade → sem perda.
        if (mediaAerea.compareTo(LIMITE_NORMAL) <= 0) {
            return TipoPerdaAuditiva.NORMAL;
        }

        // Sem dados ósseos não há como medir o gap: assume sensorioneural.
        if (mediaOssea == null) {
            return TipoPerdaAuditiva.NEUROSSENSORIAL;
        }

        BigDecimal gap        = mediaAerea.subtract(mediaOssea);
        boolean    gapRelevante = gap.compareTo(GAP_CONDUTIVO) >= 0;
        boolean    osseaNormal  = mediaOssea.compareTo(LIMITE_NORMAL) <= 0;

        if (gapRelevante && osseaNormal)  return TipoPerdaAuditiva.CONDUTIVA;       // perda só na via aérea
        if (gapRelevante)                 return TipoPerdaAuditiva.MISTA;           // gap + óssea alterada
        return TipoPerdaAuditiva.NEUROSSENSORIAL;                                   // aérea e óssea alteradas juntas
    }
}
