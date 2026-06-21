package com.api.ero_erp.otorrino.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.clinica.entity.Consulta;
import com.api.ero_erp.clinica.service.ConsultaService;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.otorrino.dto.ExameLaudoCreateDto;
import com.api.ero_erp.otorrino.dto.ExameLaudoResponseDto;
import com.api.ero_erp.otorrino.dto.ExameLaudoSummaryDto;
import com.api.ero_erp.otorrino.dto.ExameLaudoUpdateDto;
import com.api.ero_erp.otorrino.entity.ExameLaudo;
import com.api.ero_erp.otorrino.enums.TipoExameLaudo;
import com.api.ero_erp.otorrino.mapper.ExameLaudoMapper;
import com.api.ero_erp.otorrino.repository.ExameLaudoRepository;
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
public class ExameLaudoService {

    private final ExameLaudoRepository repository;
    private final PessoaService        pessoaService;
    private final UsuarioService       usuarioService;
    private final ConsultaService      consultaService;
    private final SecurityUtils        securityUtils;

    public ExameLaudoService(
            ExameLaudoRepository repository,
            PessoaService        pessoaService,
            UsuarioService       usuarioService,
            ConsultaService      consultaService,
            SecurityUtils        securityUtils
    ) {
        this.repository      = repository;
        this.pessoaService   = pessoaService;
        this.usuarioService  = usuarioService;
        this.consultaService = consultaService;
        this.securityUtils   = securityUtils;
    }

    // ── Leitura ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<ExameLaudoSummaryDto> getAll(
            Pageable       pageable,
            Long           pessoaId,
            LocalDate      dataInicio,
            LocalDate      dataFim,
            TipoExameLaudo tipoExame,
            String         nome
    ) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findAllWithFilters(pageable, clienteId, pessoaId, dataInicio, dataFim, tipoExame, nome)
                .map(ExameLaudoMapper::toSummaryDto);
    }

    @Transactional(readOnly = true)
    public ExameLaudo findById(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Exame/laudo não encontrado, verifique!"));
    }

    @Transactional(readOnly = true)
    public ExameLaudoResponseDto getResponseById(Long id) {
        return ExameLaudoMapper.toResponseDto(findById(id));
    }

    @Transactional(readOnly = true)
    public List<ExameLaudoSummaryDto> getByPessoa(Long pessoaId) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findByPessoaIdAndClienteId(pessoaId, clienteId).stream()
                .map(ExameLaudoMapper::toSummaryDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ExameLaudoSummaryDto> getByConsulta(Long consultaId) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findByConsultaIdAndClienteId(consultaId, clienteId).stream()
                .map(ExameLaudoMapper::toSummaryDto)
                .toList();
    }

    // ── Escrita ─────────────────────────────────────────────────────────────

    @Transactional
    public ExameLaudoResponseDto create(ExameLaudoCreateDto dto) {
        Cliente cliente = securityUtils.getClienteLogado();
        Pessoa  pessoa  = pessoaService.findById(dto.pessoaId());

        ExameLaudo exameLaudo = new ExameLaudo();
        exameLaudo.setCliente(cliente);
        exameLaudo.setPessoa(pessoa);
        exameLaudo.setUsuario(resolveUsuario());
        exameLaudo.setConsulta(resolveConsulta(dto.consultaId()));
        exameLaudo.setDataExame(dto.dataExame());
        exameLaudo.setTipoExame(dto.tipoExame());
        exameLaudo.setLaudo(dto.laudo());
        exameLaudo.setConclusao(dto.conclusao());
        exameLaudo.setCid(dto.cid());

        return ExameLaudoMapper.toResponseDto(repository.save(exameLaudo));
    }

    @Transactional
    public ExameLaudoResponseDto update(Long id, ExameLaudoUpdateDto dto) {
        Long       clienteId  = securityUtils.getClienteIdLogado();
        ExameLaudo exameLaudo = repository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Exame/laudo não encontrado, verifique!"));

        if (dto.pessoaId() != null)   exameLaudo.setPessoa(pessoaService.findById(dto.pessoaId()));
        if (dto.consultaId() != null) exameLaudo.setConsulta(resolveConsulta(dto.consultaId()));
        if (dto.dataExame() != null)  exameLaudo.setDataExame(dto.dataExame());
        if (dto.tipoExame() != null)  exameLaudo.setTipoExame(dto.tipoExame());
        if (dto.laudo() != null)      exameLaudo.setLaudo(dto.laudo());
        if (dto.conclusao() != null)  exameLaudo.setConclusao(dto.conclusao());
        if (dto.cid() != null)        exameLaudo.setCid(dto.cid());

        return ExameLaudoMapper.toResponseDto(repository.save(exameLaudo));
    }

    /**
     * Vincula (ou desvincula, quando {@code consultaId} é nulo) o exame/laudo a uma consulta.
     */
    @Transactional
    public ExameLaudoResponseDto vincularConsulta(Long exameLaudoId, Long consultaId) {
        Long       clienteId  = securityUtils.getClienteIdLogado();
        ExameLaudo exameLaudo = repository.findByIdAndClienteId(exameLaudoId, clienteId)
                .orElseThrow(() -> new NotFoundException("Exame/laudo não encontrado, verifique!"));

        exameLaudo.setConsulta(resolveConsulta(consultaId));

        return ExameLaudoMapper.toResponseDto(repository.save(exameLaudo));
    }

    @Transactional
    public void delete(Long id) {
        Long       clienteId  = securityUtils.getClienteIdLogado();
        ExameLaudo exameLaudo = repository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Exame/laudo não encontrado, verifique!"));
        repository.delete(exameLaudo);
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
