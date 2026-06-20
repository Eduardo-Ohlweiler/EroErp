package com.api.ero_erp.pediatria.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.pediatria.dto.AvaliacaoPediatricaCreateDto;
import com.api.ero_erp.pediatria.dto.AvaliacaoPediatricaResponseDto;
import com.api.ero_erp.pediatria.dto.AvaliacaoPediatricaSummaryDto;
import com.api.ero_erp.pediatria.dto.AvaliacaoPediatricaUpdateDto;
import com.api.ero_erp.pediatria.entity.AvaliacaoPediatrica;
import com.api.ero_erp.pediatria.entity.FormulaLactea;
import com.api.ero_erp.pediatria.repository.AvaliacaoPediatricaRepository;
import com.api.ero_erp.pediatria.repository.FormulaLacteaRepository;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.pessoa.service.PessoaService;
import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.usuario.service.UsuarioService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class AvaliacaoPediatricaService {

    private final AvaliacaoPediatricaRepository repository;
    private final FormulaLacteaRepository       formulaLacteaRepository;
    private final PessoaService                 pessoaService;
    private final UsuarioService                usuarioService;
    private final SecurityUtils                 securityUtils;

    public AvaliacaoPediatricaService(
            AvaliacaoPediatricaRepository repository,
            FormulaLacteaRepository       formulaLacteaRepository,
            PessoaService                 pessoaService,
            UsuarioService                usuarioService,
            SecurityUtils                 securityUtils
    ) {
        this.repository              = repository;
        this.formulaLacteaRepository = formulaLacteaRepository;
        this.pessoaService           = pessoaService;
        this.usuarioService          = usuarioService;
        this.securityUtils           = securityUtils;
    }

    // ── Leitura ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<AvaliacaoPediatricaSummaryDto> getAll(
            Pageable  pageable,
            Long      pessoaId,
            LocalDate dataInicio,
            LocalDate dataFim,
            Long      formulaLacteaId,
            Integer   mesesMin,
            Integer   mesesMax
    ) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findAllWithFilters(pageable, clienteId, pessoaId, dataInicio, dataFim,
                        formulaLacteaId, mesesMin, mesesMax)
                .map(this::toSummaryDto);
    }

    @Transactional(readOnly = true)
    public List<AvaliacaoPediatricaResponseDto> getAllForExport(
            Long      pessoaId,
            LocalDate dataInicio,
            LocalDate dataFim,
            Long      formulaLacteaId,
            Integer   mesesMin,
            Integer   mesesMax
    ) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findAllWithFilters(
                        Pageable.unpaged(Sort.by(Sort.Direction.DESC, "dataAvaliacao")),
                        clienteId, pessoaId, dataInicio, dataFim, formulaLacteaId, mesesMin, mesesMax)
                .map(this::toResponseDto)
                .getContent();
    }

    @Transactional(readOnly = true)
    public AvaliacaoPediatricaResponseDto findByIdResponse(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        AvaliacaoPediatrica avaliacao = repository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Avaliação pediátrica não encontrada, verifique!"));
        return toResponseDto(avaliacao);
    }

    // ── Escrita ───────────────────────────────────────────────────────────────

    @Transactional
    public AvaliacaoPediatricaResponseDto create(AvaliacaoPediatricaCreateDto dto) {
        Cliente cliente = securityUtils.getClienteLogado();
        Pessoa  pessoa  = pessoaService.findById(dto.pessoaId());
        Usuario usuario = dto.usuarioId() != null ? usuarioService.findByIdAndClienteId(dto.usuarioId()) : null;

        AvaliacaoPediatrica avaliacao = new AvaliacaoPediatrica();
        avaliacao.setCliente(cliente);
        avaliacao.setPessoa(pessoa);
        avaliacao.setUsuario(usuario);
        avaliacao.setDataAvaliacao(dto.dataAvaliacao());
        avaliacao.setSexo(dto.sexo());
        avaliacao.setIdadeMeses(dto.idadeMeses());
        avaliacao.setPeso(dto.peso());
        avaliacao.setEstatura(dto.estatura());
        avaliacao.setFormulaLactea(resolveFormula(dto.formulaLacteaId(), cliente.getId()));
        avaliacao.setFormulaNome(dto.formulaNome());
        avaliacao.setFormulaKcalPor100ml(dto.formulaKcalPor100ml());
        avaliacao.setFormulaProteinaPor100ml(dto.formulaProteinaPor100ml());
        avaliacao.setVolumeMl(dto.volumeMl());
        avaliacao.setFrequenciaHoras(dto.frequenciaHoras());
        avaliacao.setImc(dto.imc());
        avaliacao.setClassifPesoIdade(dto.classifPesoIdade());
        avaliacao.setClassifEstaturaIdade(dto.classifEstaturaIdade());
        avaliacao.setClassifImcIdade(dto.classifImcIdade());
        avaliacao.setVet(dto.vet());
        avaliacao.setProteinaNecessidade(dto.proteinaNecessidade());
        avaliacao.setVezesDia(dto.vezesDia());
        avaliacao.setVolumeTotal(dto.volumeTotal());
        avaliacao.setCaloriasTotais(dto.caloriasTotais());
        avaliacao.setProteinaTotal(dto.proteinaTotal());
        avaliacao.setPercCalorico(dto.percCalorico());
        avaliacao.setPercProteico(dto.percProteico());
        avaliacao.setObservacao(dto.observacao());

        return toResponseDto(repository.save(avaliacao));
    }

    @Transactional
    public AvaliacaoPediatricaResponseDto update(Long id, AvaliacaoPediatricaUpdateDto dto) {
        Long    clienteId = securityUtils.getClienteIdLogado();
        AvaliacaoPediatrica avaliacao = repository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Avaliação pediátrica não encontrada, verifique!"));

        if (dto.pessoaId() != null)                avaliacao.setPessoa(pessoaService.findById(dto.pessoaId()));
        if (dto.usuarioId() != null)               avaliacao.setUsuario(usuarioService.findByIdAndClienteId(dto.usuarioId()));
        if (dto.dataAvaliacao() != null)           avaliacao.setDataAvaliacao(dto.dataAvaliacao());
        if (dto.sexo() != null)                    avaliacao.setSexo(dto.sexo());
        if (dto.idadeMeses() != null)              avaliacao.setIdadeMeses(dto.idadeMeses());
        if (dto.peso() != null)                    avaliacao.setPeso(dto.peso());
        if (dto.estatura() != null)                avaliacao.setEstatura(dto.estatura());
        if (dto.formulaLacteaId() != null)         avaliacao.setFormulaLactea(resolveFormula(dto.formulaLacteaId(), clienteId));
        if (dto.formulaNome() != null)             avaliacao.setFormulaNome(dto.formulaNome());
        if (dto.formulaKcalPor100ml() != null)     avaliacao.setFormulaKcalPor100ml(dto.formulaKcalPor100ml());
        if (dto.formulaProteinaPor100ml() != null) avaliacao.setFormulaProteinaPor100ml(dto.formulaProteinaPor100ml());
        if (dto.volumeMl() != null)                avaliacao.setVolumeMl(dto.volumeMl());
        if (dto.frequenciaHoras() != null)         avaliacao.setFrequenciaHoras(dto.frequenciaHoras());
        if (dto.imc() != null)                     avaliacao.setImc(dto.imc());
        if (dto.classifPesoIdade() != null)        avaliacao.setClassifPesoIdade(dto.classifPesoIdade());
        if (dto.classifEstaturaIdade() != null)    avaliacao.setClassifEstaturaIdade(dto.classifEstaturaIdade());
        if (dto.classifImcIdade() != null)         avaliacao.setClassifImcIdade(dto.classifImcIdade());
        if (dto.vet() != null)                     avaliacao.setVet(dto.vet());
        if (dto.proteinaNecessidade() != null)     avaliacao.setProteinaNecessidade(dto.proteinaNecessidade());
        if (dto.vezesDia() != null)                avaliacao.setVezesDia(dto.vezesDia());
        if (dto.volumeTotal() != null)             avaliacao.setVolumeTotal(dto.volumeTotal());
        if (dto.caloriasTotais() != null)          avaliacao.setCaloriasTotais(dto.caloriasTotais());
        if (dto.proteinaTotal() != null)           avaliacao.setProteinaTotal(dto.proteinaTotal());
        if (dto.percCalorico() != null)            avaliacao.setPercCalorico(dto.percCalorico());
        if (dto.percProteico() != null)            avaliacao.setPercProteico(dto.percProteico());
        if (dto.observacao() != null)              avaliacao.setObservacao(dto.observacao());

        return toResponseDto(repository.save(avaliacao));
    }

    @Transactional
    public void delete(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        AvaliacaoPediatrica avaliacao = repository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Avaliação pediátrica não encontrada, verifique!"));
        repository.delete(avaliacao);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private FormulaLactea resolveFormula(Long formulaLacteaId, Long clienteId) {
        if (formulaLacteaId == null) return null;
        return formulaLacteaRepository.findByIdAndClienteIdOrGlobal(formulaLacteaId, clienteId)
                .orElseThrow(() -> new NotFoundException("Fórmula láctea não encontrada, verifique!"));
    }

    private AvaliacaoPediatricaResponseDto toResponseDto(AvaliacaoPediatrica a) {
        return new AvaliacaoPediatricaResponseDto(
                a.getId(),
                a.getPessoa().getId(),
                a.getPessoa().getNome(),
                a.getUsuario() != null ? a.getUsuario().getId() : null,
                a.getDataAvaliacao(),
                a.getSexo(),
                a.getIdadeMeses(),
                a.getPeso(),
                a.getEstatura(),
                a.getFormulaLactea() != null ? a.getFormulaLactea().getId() : null,
                a.getFormulaNome(),
                a.getFormulaKcalPor100ml(),
                a.getFormulaProteinaPor100ml(),
                a.getVolumeMl(),
                a.getFrequenciaHoras(),
                a.getImc(),
                a.getClassifPesoIdade(),
                a.getClassifEstaturaIdade(),
                a.getClassifImcIdade(),
                a.getVet(),
                a.getProteinaNecessidade(),
                a.getVezesDia(),
                a.getVolumeTotal(),
                a.getCaloriasTotais(),
                a.getProteinaTotal(),
                a.getPercCalorico(),
                a.getPercProteico(),
                a.getObservacao(),
                a.getCreatedAt(),
                a.getUpdatedAt()
        );
    }

    private AvaliacaoPediatricaSummaryDto toSummaryDto(AvaliacaoPediatrica a) {
        return new AvaliacaoPediatricaSummaryDto(
                a.getId(),
                a.getPessoa().getId(),
                a.getPessoa().getNome(),
                a.getDataAvaliacao(),
                a.getIdadeMeses(),
                a.getPeso(),
                a.getImc(),
                a.getClassifImcIdade(),
                a.getFormulaNome()
        );
    }
}
