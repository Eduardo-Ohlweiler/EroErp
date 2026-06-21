package com.api.ero_erp.otorrino.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.clinica.entity.Consulta;
import com.api.ero_erp.clinica.service.ConsultaService;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.otorrino.dto.ImitanciometriaCreateDto;
import com.api.ero_erp.otorrino.dto.ImitanciometriaResponseDto;
import com.api.ero_erp.otorrino.dto.ImitanciometriaSummaryDto;
import com.api.ero_erp.otorrino.dto.ImitanciometriaUpdateDto;
import com.api.ero_erp.otorrino.entity.Imitanciometria;
import com.api.ero_erp.otorrino.mapper.ImitanciometriaMapper;
import com.api.ero_erp.otorrino.repository.ImitanciometriaRepository;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.pessoa.service.PessoaService;
import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.usuario.service.UsuarioService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class ImitanciometriaService {

    private final ImitanciometriaRepository repository;
    private final PessoaService             pessoaService;
    private final UsuarioService            usuarioService;
    private final ConsultaService           consultaService;
    private final SecurityUtils             securityUtils;

    public ImitanciometriaService(
            ImitanciometriaRepository repository,
            PessoaService             pessoaService,
            UsuarioService            usuarioService,
            ConsultaService           consultaService,
            SecurityUtils             securityUtils
    ) {
        this.repository      = repository;
        this.pessoaService   = pessoaService;
        this.usuarioService  = usuarioService;
        this.consultaService = consultaService;
        this.securityUtils   = securityUtils;
    }

    // ── Leitura ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<ImitanciometriaSummaryDto> getAll(
            Pageable  pageable,
            Long      pessoaId,
            LocalDate dataInicio,
            LocalDate dataFim,
            String    nome
    ) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findAllWithFilters(pageable, clienteId, pessoaId, dataInicio, dataFim, nome)
                .map(ImitanciometriaMapper::toSummaryDto);
    }

    @Transactional(readOnly = true)
    public Imitanciometria findById(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Imitanciometria não encontrada, verifique!"));
    }

    @Transactional(readOnly = true)
    public ImitanciometriaResponseDto getResponseById(Long id) {
        return ImitanciometriaMapper.toResponseDto(findById(id));
    }

    @Transactional(readOnly = true)
    public List<ImitanciometriaSummaryDto> getByPessoa(Long pessoaId) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findByPessoaIdAndClienteId(pessoaId, clienteId).stream()
                .map(ImitanciometriaMapper::toSummaryDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ImitanciometriaSummaryDto> getByConsulta(Long consultaId) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findByConsultaIdAndClienteId(consultaId, clienteId).stream()
                .map(ImitanciometriaMapper::toSummaryDto)
                .toList();
    }

    // ── Escrita ─────────────────────────────────────────────────────────────

    @Transactional
    public ImitanciometriaResponseDto create(ImitanciometriaCreateDto dto) {
        Cliente cliente = securityUtils.getClienteLogado();
        Pessoa  pessoa  = pessoaService.findById(dto.pessoaId());

        Imitanciometria imitanciometria = new Imitanciometria();
        imitanciometria.setCliente(cliente);
        imitanciometria.setPessoa(pessoa);
        imitanciometria.setUsuario(resolveUsuario());
        imitanciometria.setConsulta(resolveConsulta(dto.consultaId()));
        imitanciometria.setDataExame(dto.dataExame());
        imitanciometria.setCurvaOd(dto.curvaOd());
        imitanciometria.setCurvaOe(dto.curvaOe());
        imitanciometria.setPicoPressaoOdDapa(dto.picoPressaoOdDapa());
        imitanciometria.setPicoPressaoOeDapa(dto.picoPressaoOeDapa());
        imitanciometria.setComplacenciaOdMl(dto.complacenciaOdMl());
        imitanciometria.setComplacenciaOeMl(dto.complacenciaOeMl());
        imitanciometria.setVolumeCanalOdMl(dto.volumeCanalOdMl());
        imitanciometria.setVolumeCanalOeMl(dto.volumeCanalOeMl());
        imitanciometria.setReflexoIpsiOd(dto.reflexoIpsiOd());
        imitanciometria.setReflexoContraOd(dto.reflexoContraOd());
        imitanciometria.setReflexoIpsiOe(dto.reflexoIpsiOe());
        imitanciometria.setReflexoContraOe(dto.reflexoContraOe());
        imitanciometria.setObservacao(dto.observacao());

        return ImitanciometriaMapper.toResponseDto(repository.save(imitanciometria));
    }

    @Transactional
    public ImitanciometriaResponseDto update(Long id, ImitanciometriaUpdateDto dto) {
        Long            clienteId       = securityUtils.getClienteIdLogado();
        Imitanciometria imitanciometria = repository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Imitanciometria não encontrada, verifique!"));

        if (dto.pessoaId() != null)          imitanciometria.setPessoa(pessoaService.findById(dto.pessoaId()));
        if (dto.consultaId() != null)        imitanciometria.setConsulta(resolveConsulta(dto.consultaId()));
        if (dto.dataExame() != null)         imitanciometria.setDataExame(dto.dataExame());
        if (dto.curvaOd() != null)           imitanciometria.setCurvaOd(dto.curvaOd());
        if (dto.curvaOe() != null)           imitanciometria.setCurvaOe(dto.curvaOe());
        if (dto.picoPressaoOdDapa() != null) imitanciometria.setPicoPressaoOdDapa(dto.picoPressaoOdDapa());
        if (dto.picoPressaoOeDapa() != null) imitanciometria.setPicoPressaoOeDapa(dto.picoPressaoOeDapa());
        if (dto.complacenciaOdMl() != null)  imitanciometria.setComplacenciaOdMl(dto.complacenciaOdMl());
        if (dto.complacenciaOeMl() != null)  imitanciometria.setComplacenciaOeMl(dto.complacenciaOeMl());
        if (dto.volumeCanalOdMl() != null)   imitanciometria.setVolumeCanalOdMl(dto.volumeCanalOdMl());
        if (dto.volumeCanalOeMl() != null)   imitanciometria.setVolumeCanalOeMl(dto.volumeCanalOeMl());
        if (dto.reflexoIpsiOd() != null)     imitanciometria.setReflexoIpsiOd(dto.reflexoIpsiOd());
        if (dto.reflexoContraOd() != null)   imitanciometria.setReflexoContraOd(dto.reflexoContraOd());
        if (dto.reflexoIpsiOe() != null)     imitanciometria.setReflexoIpsiOe(dto.reflexoIpsiOe());
        if (dto.reflexoContraOe() != null)   imitanciometria.setReflexoContraOe(dto.reflexoContraOe());
        if (dto.observacao() != null)        imitanciometria.setObservacao(dto.observacao());

        return ImitanciometriaMapper.toResponseDto(repository.save(imitanciometria));
    }

    /**
     * Vincula (ou desvincula, quando {@code consultaId} é nulo) a imitanciometria a uma consulta.
     */
    @Transactional
    public ImitanciometriaResponseDto vincularConsulta(Long imitanciometriaId, Long consultaId) {
        Long            clienteId       = securityUtils.getClienteIdLogado();
        Imitanciometria imitanciometria = repository.findByIdAndClienteId(imitanciometriaId, clienteId)
                .orElseThrow(() -> new NotFoundException("Imitanciometria não encontrada, verifique!"));

        imitanciometria.setConsulta(resolveConsulta(consultaId));

        return ImitanciometriaMapper.toResponseDto(repository.save(imitanciometria));
    }

    @Transactional
    public void delete(Long id) {
        Long            clienteId       = securityUtils.getClienteIdLogado();
        Imitanciometria imitanciometria = repository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Imitanciometria não encontrada, verifique!"));
        repository.delete(imitanciometria);
    }

    // ── Helpers de carga ──────────────────────────────────────────────────────

    private Usuario resolveUsuario() {
        Long id = securityUtils.getUsuarioIdLogado();
        if (id == null) return null;
        return usuarioService.findByIdAndClienteId(id);
    }

    private Consulta resolveConsulta(Long consultaId) {
        if (consultaId == null) return null;
        // ConsultaService.findById já valida o cliente logado.
        return consultaService.findById(consultaId);
    }
}
