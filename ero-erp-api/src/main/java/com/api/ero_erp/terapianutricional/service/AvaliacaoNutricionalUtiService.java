package com.api.ero_erp.terapianutricional.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.pessoa.service.PessoaService;
import com.api.ero_erp.terapianutricional.dto.AvaliacaoNutricionalUtiCreateDto;
import com.api.ero_erp.terapianutricional.dto.AvaliacaoNutricionalUtiResponseDto;
import com.api.ero_erp.terapianutricional.dto.AvaliacaoNutricionalUtiSummaryDto;
import com.api.ero_erp.terapianutricional.dto.AvaliacaoNutricionalUtiUpdateDto;
import com.api.ero_erp.terapianutricional.entity.AvaliacaoNutricionalUti;
import com.api.ero_erp.terapianutricional.entity.FormulaEnteral;
import com.api.ero_erp.terapianutricional.repository.AvaliacaoNutricionalUtiRepository;
import com.api.ero_erp.terapianutricional.repository.FormulaEnteralRepository;
import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.usuario.service.UsuarioService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class AvaliacaoNutricionalUtiService {

    private final AvaliacaoNutricionalUtiRepository repository;
    private final FormulaEnteralRepository          formulaEnteralRepository;
    private final PessoaService                     pessoaService;
    private final UsuarioService                    usuarioService;
    private final SecurityUtils                     securityUtils;

    public AvaliacaoNutricionalUtiService(
            AvaliacaoNutricionalUtiRepository repository,
            FormulaEnteralRepository          formulaEnteralRepository,
            PessoaService                     pessoaService,
            UsuarioService                    usuarioService,
            SecurityUtils                     securityUtils
    ) {
        this.repository               = repository;
        this.formulaEnteralRepository = formulaEnteralRepository;
        this.pessoaService            = pessoaService;
        this.usuarioService           = usuarioService;
        this.securityUtils            = securityUtils;
    }

    // ── Leitura ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<AvaliacaoNutricionalUtiSummaryDto> getAll(
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
    public List<AvaliacaoNutricionalUtiResponseDto> export(
            Long      pessoaId,
            LocalDate dataInicio,
            LocalDate dataFim
    ) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository
                .findAllWithFilters(Pageable.unpaged(), clienteId, pessoaId, dataInicio, dataFim)
                .stream()
                .sorted((a, b) -> b.getDataAvaliacao().compareTo(a.getDataAvaliacao()))
                .map(this::toResponseDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public AvaliacaoNutricionalUtiResponseDto findByIdResponse(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        AvaliacaoNutricionalUti avaliacao = repository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Avaliação nutricional não encontrada, verifique!"));
        return toResponseDto(avaliacao);
    }

    // ── Escrita ───────────────────────────────────────────────────────────────

    @Transactional
    public AvaliacaoNutricionalUtiResponseDto create(AvaliacaoNutricionalUtiCreateDto dto) {
        Cliente cliente = securityUtils.getClienteLogado();
        Pessoa  pessoa  = pessoaService.findById(dto.pessoaId());
        Usuario usuario = dto.usuarioId() != null ? usuarioService.findByIdAndClienteId(dto.usuarioId()) : null;

        AvaliacaoNutricionalUti a = new AvaliacaoNutricionalUti();
        a.setCliente(cliente);
        a.setPessoa(pessoa);
        a.setUsuario(usuario);
        a.setDataAvaliacao(dto.dataAvaliacao());

        // Entradas antropometria
        a.setSexo(dto.sexo());
        a.setRaca(dto.raca());
        a.setIdade(dto.idade());
        a.setCb(dto.cb());
        a.setCp(dto.cp());
        a.setCa(dto.ca());
        a.setAj(dto.aj());
        a.setPesoAtual(dto.pesoAtual());
        a.setPesoUsual(dto.pesoUsual());
        a.setAltura(dto.altura());

        // Resultados antropometria
        a.setAlturaEstimada(dto.alturaEstimada());
        a.setPesoEstimadoChumlea(dto.pesoEstimadoChumlea());
        a.setPesoEstimadoJung(dto.pesoEstimadoJung());
        a.setPesoEstimadoRabito(dto.pesoEstimadoRabito());
        a.setImc(dto.imc());
        a.setPesoIdeal(dto.pesoIdeal());
        a.setPesoIdealImc25(dto.pesoIdealImc25());
        a.setPesoAjustado(dto.pesoAjustado());
        a.setPercPerdaPeso(dto.percPerdaPeso());
        a.setPercAdequacaoCb(dto.percAdequacaoCb());
        a.setClassifImcOms(dto.classifImcOms());
        a.setClassifImcOpas(dto.classifImcOpas());
        a.setClassifPerdaPeso(dto.classifPerdaPeso());
        a.setClassifAdequacaoCb(dto.classifAdequacaoCb());
        a.setClassifDeplecaoCp(dto.classifDeplecaoCp());

        // Necessidades
        a.setFase(dto.fase());
        a.setKcalKgAlvo(dto.kcalKgAlvo());
        a.setPtnKgAlvo(dto.ptnKgAlvo());
        a.setKcalMin(dto.kcalMin());
        a.setKcalMax(dto.kcalMax());
        a.setPtnMin(dto.ptnMin());
        a.setPtnMax(dto.ptnMax());
        a.setKcalTotal(dto.kcalTotal());
        a.setPtnTotal(dto.ptnTotal());
        a.setPtnHdIntermitente(dto.ptnHdIntermitente());
        a.setPtnHdContinua(dto.ptnHdContinua());

        // Dieta enteral
        a.setFormulaEnteral(resolveFormula(dto.formulaEnteralId(), cliente.getId()));
        a.setFormulaNome(dto.formulaNome());
        a.setFormulaDensidadeKcalMl(dto.formulaDensidadeKcalMl());
        a.setFormulaProteinaGL(dto.formulaProteinaGL());
        a.setModoDieta(dto.modoDieta());
        a.setVolumeDieta(dto.volumeDieta());
        a.setTempoDieta(dto.tempoDieta());
        a.setDietaVt(dto.dietaVt());
        a.setDietaKcal(dto.dietaKcal());
        a.setDietaPtn(dto.dietaPtn());
        a.setDietaKcalKg(dto.dietaKcalKg());
        a.setDietaPtnKg(dto.dietaPtnKg());
        a.setDietaPercVct(dto.dietaPercVct());
        a.setDietaPercPtn(dto.dietaPercPtn());
        a.setDietaVolumePleno(dto.dietaVolumePleno());

        // Hidratação
        a.setHidratacaoVolumeDieta(dto.hidratacaoVolumeDieta());
        a.setHidratacaoNecMin(dto.hidratacaoNecMin());
        a.setHidratacaoNecIdeal(dto.hidratacaoNecIdeal());
        a.setHidratacaoAguaDieta(dto.hidratacaoAguaDieta());
        a.setHidratacaoAguaExtraMin(dto.hidratacaoAguaExtraMin());
        a.setHidratacaoAguaExtraIdeal(dto.hidratacaoAguaExtraIdeal());

        a.setObservacao(dto.observacao());

        return toResponseDto(repository.save(a));
    }

    @Transactional
    public AvaliacaoNutricionalUtiResponseDto update(Long id, AvaliacaoNutricionalUtiUpdateDto dto) {
        Long clienteId = securityUtils.getClienteIdLogado();
        AvaliacaoNutricionalUti a = repository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Avaliação nutricional não encontrada, verifique!"));

        if (dto.pessoaId() != null)        a.setPessoa(pessoaService.findById(dto.pessoaId()));
        if (dto.usuarioId() != null)       a.setUsuario(usuarioService.findByIdAndClienteId(dto.usuarioId()));
        if (dto.dataAvaliacao() != null)   a.setDataAvaliacao(dto.dataAvaliacao());

        // Entradas antropometria
        if (dto.sexo() != null)            a.setSexo(dto.sexo());
        if (dto.raca() != null)            a.setRaca(dto.raca());
        if (dto.idade() != null)           a.setIdade(dto.idade());
        if (dto.cb() != null)              a.setCb(dto.cb());
        if (dto.cp() != null)              a.setCp(dto.cp());
        if (dto.ca() != null)              a.setCa(dto.ca());
        if (dto.aj() != null)              a.setAj(dto.aj());
        if (dto.pesoAtual() != null)       a.setPesoAtual(dto.pesoAtual());
        if (dto.pesoUsual() != null)       a.setPesoUsual(dto.pesoUsual());
        if (dto.altura() != null)          a.setAltura(dto.altura());

        // Resultados antropometria
        if (dto.alturaEstimada() != null)      a.setAlturaEstimada(dto.alturaEstimada());
        if (dto.pesoEstimadoChumlea() != null) a.setPesoEstimadoChumlea(dto.pesoEstimadoChumlea());
        if (dto.pesoEstimadoJung() != null)    a.setPesoEstimadoJung(dto.pesoEstimadoJung());
        if (dto.pesoEstimadoRabito() != null)  a.setPesoEstimadoRabito(dto.pesoEstimadoRabito());
        if (dto.imc() != null)                 a.setImc(dto.imc());
        if (dto.pesoIdeal() != null)           a.setPesoIdeal(dto.pesoIdeal());
        if (dto.pesoIdealImc25() != null)      a.setPesoIdealImc25(dto.pesoIdealImc25());
        if (dto.pesoAjustado() != null)        a.setPesoAjustado(dto.pesoAjustado());
        if (dto.percPerdaPeso() != null)       a.setPercPerdaPeso(dto.percPerdaPeso());
        if (dto.percAdequacaoCb() != null)     a.setPercAdequacaoCb(dto.percAdequacaoCb());
        if (dto.classifImcOms() != null)       a.setClassifImcOms(dto.classifImcOms());
        if (dto.classifImcOpas() != null)      a.setClassifImcOpas(dto.classifImcOpas());
        if (dto.classifPerdaPeso() != null)    a.setClassifPerdaPeso(dto.classifPerdaPeso());
        if (dto.classifAdequacaoCb() != null)  a.setClassifAdequacaoCb(dto.classifAdequacaoCb());
        if (dto.classifDeplecaoCp() != null)   a.setClassifDeplecaoCp(dto.classifDeplecaoCp());

        // Necessidades
        if (dto.fase() != null)              a.setFase(dto.fase());
        if (dto.kcalKgAlvo() != null)        a.setKcalKgAlvo(dto.kcalKgAlvo());
        if (dto.ptnKgAlvo() != null)         a.setPtnKgAlvo(dto.ptnKgAlvo());
        if (dto.kcalMin() != null)           a.setKcalMin(dto.kcalMin());
        if (dto.kcalMax() != null)           a.setKcalMax(dto.kcalMax());
        if (dto.ptnMin() != null)            a.setPtnMin(dto.ptnMin());
        if (dto.ptnMax() != null)            a.setPtnMax(dto.ptnMax());
        if (dto.kcalTotal() != null)         a.setKcalTotal(dto.kcalTotal());
        if (dto.ptnTotal() != null)          a.setPtnTotal(dto.ptnTotal());
        if (dto.ptnHdIntermitente() != null) a.setPtnHdIntermitente(dto.ptnHdIntermitente());
        if (dto.ptnHdContinua() != null)     a.setPtnHdContinua(dto.ptnHdContinua());

        // Dieta enteral
        if (dto.formulaEnteralId() != null)       a.setFormulaEnteral(resolveFormula(dto.formulaEnteralId(), clienteId));
        if (dto.formulaNome() != null)            a.setFormulaNome(dto.formulaNome());
        if (dto.formulaDensidadeKcalMl() != null) a.setFormulaDensidadeKcalMl(dto.formulaDensidadeKcalMl());
        if (dto.formulaProteinaGL() != null)      a.setFormulaProteinaGL(dto.formulaProteinaGL());
        if (dto.modoDieta() != null)              a.setModoDieta(dto.modoDieta());
        if (dto.volumeDieta() != null)            a.setVolumeDieta(dto.volumeDieta());
        if (dto.tempoDieta() != null)             a.setTempoDieta(dto.tempoDieta());
        if (dto.dietaVt() != null)                a.setDietaVt(dto.dietaVt());
        if (dto.dietaKcal() != null)              a.setDietaKcal(dto.dietaKcal());
        if (dto.dietaPtn() != null)               a.setDietaPtn(dto.dietaPtn());
        if (dto.dietaKcalKg() != null)            a.setDietaKcalKg(dto.dietaKcalKg());
        if (dto.dietaPtnKg() != null)             a.setDietaPtnKg(dto.dietaPtnKg());
        if (dto.dietaPercVct() != null)           a.setDietaPercVct(dto.dietaPercVct());
        if (dto.dietaPercPtn() != null)           a.setDietaPercPtn(dto.dietaPercPtn());
        if (dto.dietaVolumePleno() != null)       a.setDietaVolumePleno(dto.dietaVolumePleno());

        // Hidratação
        if (dto.hidratacaoVolumeDieta() != null)    a.setHidratacaoVolumeDieta(dto.hidratacaoVolumeDieta());
        if (dto.hidratacaoNecMin() != null)         a.setHidratacaoNecMin(dto.hidratacaoNecMin());
        if (dto.hidratacaoNecIdeal() != null)       a.setHidratacaoNecIdeal(dto.hidratacaoNecIdeal());
        if (dto.hidratacaoAguaDieta() != null)      a.setHidratacaoAguaDieta(dto.hidratacaoAguaDieta());
        if (dto.hidratacaoAguaExtraMin() != null)   a.setHidratacaoAguaExtraMin(dto.hidratacaoAguaExtraMin());
        if (dto.hidratacaoAguaExtraIdeal() != null) a.setHidratacaoAguaExtraIdeal(dto.hidratacaoAguaExtraIdeal());

        if (dto.observacao() != null)        a.setObservacao(dto.observacao());

        return toResponseDto(repository.save(a));
    }

    @Transactional
    public void delete(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        AvaliacaoNutricionalUti a = repository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Avaliação nutricional não encontrada, verifique!"));
        repository.delete(a);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private FormulaEnteral resolveFormula(Long formulaEnteralId, Long clienteId) {
        if (formulaEnteralId == null) return null;
        return formulaEnteralRepository.findByIdAndClienteIdOrGlobal(formulaEnteralId, clienteId)
                .orElseThrow(() -> new NotFoundException("Fórmula enteral não encontrada, verifique!"));
    }

    private AvaliacaoNutricionalUtiResponseDto toResponseDto(AvaliacaoNutricionalUti a) {
        return new AvaliacaoNutricionalUtiResponseDto(
                a.getId(),
                a.getPessoa().getId(),
                a.getPessoa().getNome(),
                a.getUsuario() != null ? a.getUsuario().getId() : null,
                a.getDataAvaliacao(),
                a.getSexo(),
                a.getRaca(),
                a.getIdade(),
                a.getCb(),
                a.getCp(),
                a.getCa(),
                a.getAj(),
                a.getPesoAtual(),
                a.getPesoUsual(),
                a.getAltura(),
                a.getAlturaEstimada(),
                a.getPesoEstimadoChumlea(),
                a.getPesoEstimadoJung(),
                a.getPesoEstimadoRabito(),
                a.getImc(),
                a.getPesoIdeal(),
                a.getPesoIdealImc25(),
                a.getPesoAjustado(),
                a.getPercPerdaPeso(),
                a.getPercAdequacaoCb(),
                a.getClassifImcOms(),
                a.getClassifImcOpas(),
                a.getClassifPerdaPeso(),
                a.getClassifAdequacaoCb(),
                a.getClassifDeplecaoCp(),
                a.getFase(),
                a.getKcalKgAlvo(),
                a.getPtnKgAlvo(),
                a.getKcalMin(),
                a.getKcalMax(),
                a.getPtnMin(),
                a.getPtnMax(),
                a.getKcalTotal(),
                a.getPtnTotal(),
                a.getPtnHdIntermitente(),
                a.getPtnHdContinua(),
                a.getFormulaEnteral() != null ? a.getFormulaEnteral().getId() : null,
                a.getFormulaNome(),
                a.getFormulaDensidadeKcalMl(),
                a.getFormulaProteinaGL(),
                a.getModoDieta(),
                a.getVolumeDieta(),
                a.getTempoDieta(),
                a.getDietaVt(),
                a.getDietaKcal(),
                a.getDietaPtn(),
                a.getDietaKcalKg(),
                a.getDietaPtnKg(),
                a.getDietaPercVct(),
                a.getDietaPercPtn(),
                a.getDietaVolumePleno(),
                a.getHidratacaoVolumeDieta(),
                a.getHidratacaoNecMin(),
                a.getHidratacaoNecIdeal(),
                a.getHidratacaoAguaDieta(),
                a.getHidratacaoAguaExtraMin(),
                a.getHidratacaoAguaExtraIdeal(),
                a.getObservacao(),
                a.getCreatedAt(),
                a.getUpdatedAt()
        );
    }

    private AvaliacaoNutricionalUtiSummaryDto toSummaryDto(AvaliacaoNutricionalUti a) {
        return new AvaliacaoNutricionalUtiSummaryDto(
                a.getId(),
                a.getPessoa().getId(),
                a.getPessoa().getNome(),
                a.getDataAvaliacao(),
                a.getPesoAtual(),
                a.getImc(),
                a.getClassifImcOms(),
                a.getFormulaNome()
        );
    }
}
