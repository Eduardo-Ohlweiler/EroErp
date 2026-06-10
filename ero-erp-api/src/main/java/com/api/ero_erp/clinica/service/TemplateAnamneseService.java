package com.api.ero_erp.clinica.service;

import com.api.ero_erp.clinica.dto.*;
import com.api.ero_erp.clinica.entity.CampoAnamnese;
import com.api.ero_erp.clinica.entity.TemplateAnamnese;
import com.api.ero_erp.clinica.enums.TipoFinalidade;
import com.api.ero_erp.clinica.mapper.TemplateAnamneseMapper;
import com.api.ero_erp.clinica.repository.CampoAnamneseRepository;
import com.api.ero_erp.clinica.repository.TemplateAnamneseRepository;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.exceptions.BadRequestException;
import com.api.ero_erp.exceptions.NotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TemplateAnamneseService {

    private final TemplateAnamneseRepository templateRepository;
    private final CampoAnamneseRepository    campoRepository;
    private final SecurityUtils              securityUtils;

    public TemplateAnamneseService(
            TemplateAnamneseRepository templateRepository,
            CampoAnamneseRepository    campoRepository,
            SecurityUtils              securityUtils
    ) {
        this.templateRepository = templateRepository;
        this.campoRepository    = campoRepository;
        this.securityUtils      = securityUtils;
    }

    // ── Leitura ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<TemplateAnamnesesSummaryDto> getAll(
            Pageable       pageable,
            String         nome,
            TipoFinalidade finalidade
    ) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return templateRepository.findAllWithFilters(pageable, clienteId, nome, finalidade)
                .map(TemplateAnamneseMapper::toSummaryDto);
    }

    @Transactional(readOnly = true)
    public TemplateAnamneseResponseDto findByIdResponse(Long id) {
        Long            clienteId = securityUtils.getClienteIdLogado();
        TemplateAnamnese template = templateRepository.findByIdWithCampos(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Template de anamnese não encontrado, verifique!"));
        return TemplateAnamneseMapper.toResponseDto(template);
    }

    @Transactional(readOnly = true)
    public TemplateAnamneseResponseDto getByFinalidade(TipoFinalidade finalidade) {
        Long clienteId = securityUtils.getClienteIdLogado();
        List<TemplateAnamnese> templates = templateRepository.findAtivosByFinalidade(finalidade, clienteId);
        if (templates.isEmpty())
            throw new NotFoundException("Nenhum template ativo encontrado para a finalidade informada, verifique!");
        return TemplateAnamneseMapper.toResponseDto(templates.get(0));
    }

    // ── Escrita ───────────────────────────────────────────────────────────────

    @Transactional
    public TemplateAnamneseResponseDto create(TemplateAnamneseCreateDto dto) {
        Long    clienteId = securityUtils.getClienteIdLogado();
        Cliente cliente   = securityUtils.getClienteLogado();
        Long    usuarioId = securityUtils.getUsuarioIdLogado();

        TemplateAnamnese template = new TemplateAnamnese();
        template.setCliente(cliente);
        template.setNome(dto.nome());
        template.setFinalidade(dto.finalidade());
        template.setDescricao(dto.descricao());
        template.setAtivo(dto.ativo() != null ? dto.ativo() : true);
        template.setCreatedBy(usuarioId);

        templateRepository.save(template);

        // Recarregar com campos (vazio neste momento)
        return TemplateAnamneseMapper.toResponseDto(template);
    }

    @Transactional
    public TemplateAnamneseResponseDto update(Long id, TemplateAnamneseUpdateDto dto) {
        Long            clienteId = securityUtils.getClienteIdLogado();
        TemplateAnamnese template  = templateRepository.findByIdWithCampos(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Template de anamnese não encontrado, verifique!"));

        if (template.getCliente() == null)
            throw new BadRequestException("Não é permitido editar templates globais, verifique!");

        if (dto.nome() != null && !dto.nome().isBlank()) template.setNome(dto.nome());
        if (dto.finalidade() != null)                    template.setFinalidade(dto.finalidade());
        if (dto.descricao() != null)                     template.setDescricao(dto.descricao());
        if (dto.ativo() != null)                         template.setAtivo(dto.ativo());
        template.setUpdatedBy(securityUtils.getUsuarioIdLogado());

        return TemplateAnamneseMapper.toResponseDto(templateRepository.save(template));
    }

    @Transactional
    public void delete(Long id) {
        Long            clienteId = securityUtils.getClienteIdLogado();
        TemplateAnamnese template  = templateRepository.findByIdWithCampos(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Template de anamnese não encontrado, verifique!"));

        if (template.getCliente() == null)
            throw new BadRequestException("Não é permitido excluir templates globais, verifique!");

        templateRepository.delete(template);
    }

    @Transactional
    public TemplateAnamneseResponseDto clonar(Long id) {
        Cliente cliente   = securityUtils.getClienteLogado();
        Long    usuarioId = securityUtils.getUsuarioIdLogado();

        TemplateAnamnese original = templateRepository.findByIdWithCampos(id, securityUtils.getClienteIdLogado())
                .orElseThrow(() -> new NotFoundException("Template de anamnese não encontrado, verifique!"));

        TemplateAnamnese novoTemplate = new TemplateAnamnese();
        novoTemplate.setCliente(cliente);
        novoTemplate.setNome(original.getNome() + " (cópia)");
        novoTemplate.setFinalidade(original.getFinalidade());
        novoTemplate.setDescricao(original.getDescricao());
        novoTemplate.setAtivo(true);
        novoTemplate.setCreatedBy(usuarioId);

        templateRepository.save(novoTemplate);

        List<CampoAnamnese> novosCampos = original.getCampos().stream()
                .map(c -> {
                    CampoAnamnese novo = new CampoAnamnese();
                    novo.setCliente(cliente);
                    novo.setTemplate(novoTemplate);
                    novo.setSecao(c.getSecao());
                    novo.setRotulo(c.getRotulo());
                    novo.setTipo(c.getTipo());
                    novo.setOpcoes(c.getOpcoes());
                    novo.setOrdem(c.getOrdem());
                    novo.setObrigatorio(c.getObrigatorio());
                    novo.setAtivo(c.getAtivo());
                    return novo;
                })
                .toList();

        campoRepository.saveAll(novosCampos);

        return TemplateAnamneseMapper.toResponseDto(novoTemplate);
    }

    // ── Campos ────────────────────────────────────────────────────────────────

    @Transactional
    public CampoAnamneseResponseDto adicionarCampo(Long templateId, CampoAnamneseCreateDto dto) {
        Long            clienteId = securityUtils.getClienteIdLogado();
        TemplateAnamnese template  = templateRepository.findByIdWithCampos(templateId, clienteId)
                .orElseThrow(() -> new NotFoundException("Template de anamnese não encontrado, verifique!"));

        if (template.getCliente() == null)
            throw new BadRequestException("Não é permitido adicionar campos em templates globais, verifique!");

        Cliente cliente = securityUtils.getClienteLogado();

        CampoAnamnese campo = new CampoAnamnese();
        campo.setCliente(cliente);
        campo.setTemplate(template);
        campo.setSecao(dto.secao());
        campo.setRotulo(dto.rotulo());
        campo.setTipo(dto.tipo());
        campo.setOpcoes(dto.opcoes());
        campo.setOrdem(dto.ordem() != null ? dto.ordem() : 0);
        campo.setObrigatorio(dto.obrigatorio() != null ? dto.obrigatorio() : false);
        campo.setAtivo(dto.ativo() != null ? dto.ativo() : true);

        campoRepository.save(campo);
        return TemplateAnamneseMapper.toCampoDto(campo);
    }

    @Transactional
    public CampoAnamneseResponseDto atualizarCampo(Long templateId, Long campoId, CampoAnamneseCreateDto dto) {
        Long            clienteId = securityUtils.getClienteIdLogado();
        TemplateAnamnese template  = templateRepository.findByIdWithCampos(templateId, clienteId)
                .orElseThrow(() -> new NotFoundException("Template de anamnese não encontrado, verifique!"));

        if (template.getCliente() == null)
            throw new BadRequestException("Não é permitido editar campos de templates globais, verifique!");

        CampoAnamnese campo = campoRepository.findByIdAndTemplateId(campoId, templateId)
                .orElseThrow(() -> new NotFoundException("Campo não encontrado no template, verifique!"));

        if (dto.secao() != null)      campo.setSecao(dto.secao());
        if (dto.rotulo() != null && !dto.rotulo().isBlank()) campo.setRotulo(dto.rotulo());
        if (dto.tipo() != null)       campo.setTipo(dto.tipo());
        if (dto.opcoes() != null)     campo.setOpcoes(dto.opcoes());
        if (dto.ordem() != null)      campo.setOrdem(dto.ordem());
        if (dto.obrigatorio() != null) campo.setObrigatorio(dto.obrigatorio());
        if (dto.ativo() != null)      campo.setAtivo(dto.ativo());

        return TemplateAnamneseMapper.toCampoDto(campoRepository.save(campo));
    }

    @Transactional
    public void removerCampo(Long templateId, Long campoId) {
        Long            clienteId = securityUtils.getClienteIdLogado();
        TemplateAnamnese template  = templateRepository.findByIdWithCampos(templateId, clienteId)
                .orElseThrow(() -> new NotFoundException("Template de anamnese não encontrado, verifique!"));

        if (template.getCliente() == null)
            throw new BadRequestException("Não é permitido remover campos de templates globais, verifique!");

        CampoAnamnese campo = campoRepository.findByIdAndTemplateId(campoId, templateId)
                .orElseThrow(() -> new NotFoundException("Campo não encontrado no template, verifique!"));

        campoRepository.delete(campo);
    }

    // ── Uso interno ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public TemplateAnamnese findByIdInterno(Long id, Long clienteId) {
        return templateRepository.findByIdWithCampos(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Template de anamnese não encontrado, verifique!"));
    }
}
