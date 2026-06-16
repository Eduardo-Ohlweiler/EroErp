package com.api.ero_erp.clinica.service;

import com.api.ero_erp.clinica.dto.*;
import com.api.ero_erp.clinica.entity.CampoAnamnese;
import com.api.ero_erp.clinica.entity.Consulta;
import com.api.ero_erp.clinica.entity.FichaAnamnese;
import com.api.ero_erp.clinica.entity.RespostaAnamnese;
import com.api.ero_erp.clinica.entity.TemplateAnamnese;
import com.api.ero_erp.clinica.enums.TipoFinalidade;
import com.api.ero_erp.clinica.mapper.FichaAnamneseMapper;
import com.api.ero_erp.clinica.repository.CampoAnamneseRepository;
import com.api.ero_erp.clinica.repository.ConsultaRepository;
import com.api.ero_erp.clinica.repository.FichaAnamneseRepository;
import com.api.ero_erp.clinica.repository.RespostaAnamneseRepository;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.emitente.entity.Emitente;
import com.api.ero_erp.emitente.service.EmitenteService;
import com.api.ero_erp.exceptions.ConflictException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.pessoa.service.PessoaService;
import com.api.ero_erp.whatsapp.service.WhatsappNotificationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FichaAnamneseService {

    private final FichaAnamneseRepository     fichaRepository;
    private final RespostaAnamneseRepository  respostaRepository;
    private final CampoAnamneseRepository     campoRepository;
    private final ConsultaRepository          consultaRepository;
    private final TemplateAnamneseService     templateService;
    private final PessoaService               pessoaService;
    private final EmitenteService             emitenteService;
    private final SecurityUtils               securityUtils;
    private final WhatsappNotificationService notificationService;

    public FichaAnamneseService(
            FichaAnamneseRepository     fichaRepository,
            RespostaAnamneseRepository  respostaRepository,
            CampoAnamneseRepository     campoRepository,
            ConsultaRepository          consultaRepository,
            TemplateAnamneseService     templateService,
            PessoaService               pessoaService,
            EmitenteService             emitenteService,
            SecurityUtils               securityUtils,
            WhatsappNotificationService notificationService
    ) {
        this.fichaRepository     = fichaRepository;
        this.respostaRepository  = respostaRepository;
        this.campoRepository     = campoRepository;
        this.consultaRepository  = consultaRepository;
        this.templateService     = templateService;
        this.pessoaService       = pessoaService;
        this.emitenteService     = emitenteService;
        this.securityUtils       = securityUtils;
        this.notificationService = notificationService;
    }

    // ── Leitura ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public FichaAnamnese findById(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return fichaRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Ficha de anamnese não encontrada, verifique!"));
    }

    @Transactional(readOnly = true)
    public Page<FichaAnamnesesSummaryDto> getAll(
            Pageable       pageable,
            Long           pessoaId,
            TipoFinalidade finalidade
    ) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return fichaRepository.findAllWithFilters(pageable, clienteId, pessoaId, finalidade)
                .map(FichaAnamneseMapper::toSummaryDto);
    }

    @Transactional(readOnly = true)
    public FichaAnamneseResponseDto findByIdResponse(Long id) {
        FichaAnamnese ficha     = findById(id);
        List<RespostaAnamneseResponseDto> respostasDto = buildRespostasDto(ficha);
        return FichaAnamneseMapper.toResponseDto(ficha, respostasDto);
    }

    @Transactional(readOnly = true)
    public List<FichaAnamnesesSummaryDto> findByPessoa(Long pessoaId) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return fichaRepository.findByClienteIdAndPessoaId(clienteId, pessoaId)
                .stream()
                .map(FichaAnamneseMapper::toSummaryDto)
                .toList();
    }

    // ── Escrita ───────────────────────────────────────────────────────────────

    @Transactional
    public FichaAnamneseResponseDto create(FichaAnamneseCreateDto dto) {
        Long     clienteId = securityUtils.getClienteIdLogado();
        Cliente  cliente   = securityUtils.getClienteLogado();
        Long     usuarioId = securityUtils.getUsuarioIdLogado();

        TemplateAnamnese template = templateService.findByIdInterno(dto.templateId(), clienteId);
        Pessoa           pessoa   = pessoaService.findById(dto.pessoaId());
        Emitente         emitente = dto.emitenteId() != null
                ? emitenteService.findById(dto.emitenteId())
                : null;

        FichaAnamnese ficha = new FichaAnamnese();
        ficha.setCliente(cliente);
        ficha.setTemplate(template);
        ficha.setPessoa(pessoa);
        ficha.setEmitente(emitente);
        ficha.setDataPreenchimento(dto.dataPreenchimento());
        ficha.setObservacoes(dto.observacoes());
        ficha.setCreatedBy(usuarioId);

        fichaRepository.save(ficha);

        if (dto.respostas() != null) {
            for (RespostaAnamneseDto r : dto.respostas()) {
                CampoAnamnese campo = campoRepository.findById(r.campoId())
                        .orElseThrow(() -> new NotFoundException("Campo de anamnese não encontrado, verifique!"));
                RespostaAnamnese resposta = new RespostaAnamnese();
                resposta.setClienteId(clienteId);
                resposta.setFicha(ficha);
                resposta.setCampo(campo);
                resposta.setValor(r.valor());
                respostaRepository.save(resposta);
            }
        }

        List<RespostaAnamneseResponseDto> respostasDto = buildRespostasDto(ficha);
        return FichaAnamneseMapper.toResponseDto(ficha, respostasDto);
    }

    @Transactional
    public FichaAnamneseResponseDto update(Long id, FichaAnamneseUpdateDto dto) {
        Long          clienteId = securityUtils.getClienteIdLogado();
        FichaAnamnese ficha     = findById(id);
        Long          usuarioId = securityUtils.getUsuarioIdLogado();

        Emitente emitente = dto.emitenteId() != null
                ? emitenteService.findById(dto.emitenteId())
                : null;

        ficha.setEmitente(emitente);
        ficha.setDataPreenchimento(dto.dataPreenchimento());
        ficha.setObservacoes(dto.observacoes());
        ficha.setUpdatedBy(usuarioId);

        fichaRepository.save(ficha);

        // Substitui todas as respostas
        respostaRepository.deleteByFichaId(ficha.getId());

        if (dto.respostas() != null) {
            for (RespostaAnamneseDto r : dto.respostas()) {
                CampoAnamnese campo = campoRepository.findById(r.campoId())
                        .orElseThrow(() -> new NotFoundException("Campo de anamnese não encontrado, verifique!"));
                RespostaAnamnese resposta = new RespostaAnamnese();
                resposta.setClienteId(clienteId);
                resposta.setFicha(ficha);
                resposta.setCampo(campo);
                resposta.setValor(r.valor());
                respostaRepository.save(resposta);
            }
        }

        // Recarregar ficha para refletir o estado atualizado
        FichaAnamnese fichaAtualizada = findById(id);
        List<RespostaAnamneseResponseDto> respostasDto = buildRespostasDto(fichaAtualizada);
        return FichaAnamneseMapper.toResponseDto(fichaAtualizada, respostasDto);
    }

    @Transactional
    public void delete(Long id) {
        FichaAnamnese ficha = findById(id);

        List<Consulta> consultas = consultaRepository.findByFichaAnamneseId(id);
        if (!consultas.isEmpty()) {
            String datas = consultas.stream()
                    .map(c -> c.getInicio().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
                    .distinct()
                    .collect(Collectors.joining(", "));
            String msg = consultas.size() == 1
                    ? "Não é possível excluir esta ficha de anamnese porque ela está em uso na consulta de " + datas + "."
                    : "Não é possível excluir esta ficha de anamnese porque ela está em uso nas consultas de " + datas + ".";
            throw new ConflictException(msg);
        }

        fichaRepository.delete(ficha);
    }

    @Transactional(readOnly = true)
    public void enviarPdfWhatsapp(Long fichaId, EnviarPdfFichaDto dto) {
        FichaAnamnese ficha = findById(fichaId);
        notificationService.enviarPdfParaCliente(
                ficha.getPessoa().getId(),
                ficha.getCliente().getId(),
                securityUtils.getUsuarioIdLogado(),
                dto.base64(),
                dto.fileName(),
                dto.caption()
        );
    }

    // ── Auxiliares ────────────────────────────────────────────────────────────

    private List<RespostaAnamneseResponseDto> buildRespostasDto(FichaAnamnese ficha) {
        List<RespostaAnamnese> respostas = respostaRepository.findByFichaId(ficha.getId());
        return respostas.stream().map(r -> {
            CampoAnamnese campo = r.getCampo();
            return new RespostaAnamneseResponseDto(
                    campo.getId(),
                    campo.getSecao(),
                    campo.getRotulo(),
                    campo.getTipo().name(),
                    campo.getOpcoes(),
                    campo.getOrdem(),
                    campo.getObrigatorio(),
                    r.getValor()
            );
        }).sorted(Comparator.comparingInt(RespostaAnamneseResponseDto::ordem)).toList();
    }
}
