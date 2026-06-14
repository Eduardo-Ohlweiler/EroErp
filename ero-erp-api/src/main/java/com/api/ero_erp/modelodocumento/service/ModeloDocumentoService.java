package com.api.ero_erp.modelodocumento.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.cliente.service.ClienteService;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.exceptions.ConflictException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.modelodocumento.dtos.ModeloDocumentoCreateDto;
import com.api.ero_erp.modelodocumento.dtos.ModeloDocumentoResponseDto;
import com.api.ero_erp.modelodocumento.dtos.ModeloDocumentoSelectDto;
import com.api.ero_erp.modelodocumento.dtos.ModeloDocumentoUpdateDto;
import com.api.ero_erp.modelodocumento.entity.ModeloDocumento;
import com.api.ero_erp.modelodocumento.mapper.ModeloDocumentoMapper;
import com.api.ero_erp.modelodocumento.repository.ModeloDocumentoRepository;
import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.usuario.service.UsuarioService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Slf4j
public class ModeloDocumentoService {

    private final ModeloDocumentoRepository modeloDocumentoRepository;
    private final ClienteService            clienteService;
    private final UsuarioService            usuarioService;
    private final SecurityUtils             securityUtils;

    public ModeloDocumentoService(
            ModeloDocumentoRepository modeloDocumentoRepository,
            ClienteService            clienteService,
            UsuarioService            usuarioService,
            SecurityUtils             securityUtils
    ) {
        this.modeloDocumentoRepository = modeloDocumentoRepository;
        this.clienteService            = clienteService;
        this.usuarioService            = usuarioService;
        this.securityUtils             = securityUtils;
    }

    @Transactional(readOnly = true)
    public ModeloDocumento findById(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return modeloDocumentoRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Modelo de documento não encontrado, verifique!"));
    }

    @Transactional(readOnly = true)
    public ModeloDocumentoResponseDto findByIdResponse(Long id) {
        return ModeloDocumentoMapper.toDto(findById(id));
    }

    @Transactional(readOnly = true)
    public Page<ModeloDocumentoResponseDto> getAll(Pageable pageable, String nome, Boolean ativo) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return modeloDocumentoRepository.findAllWithFilters(pageable, clienteId, nome, ativo)
                .map(ModeloDocumentoMapper::toDto);
    }

    @Transactional(readOnly = true)
    public List<ModeloDocumentoSelectDto> getSelect() {
        Long clienteId = securityUtils.getClienteIdLogado();
        return modeloDocumentoRepository.findAllSelectByClienteId(clienteId);
    }

    @Transactional
    public ModeloDocumentoResponseDto create(ModeloDocumentoCreateDto dto) {
        Long clienteId = securityUtils.getClienteIdLogado();

        if (modeloDocumentoRepository.existsByNomeIgnoreCaseAndClienteId(dto.nome(), clienteId)) {
            throw new ConflictException("Já existe um modelo de documento com esse nome, verifique!");
        }

        Cliente cliente = clienteService.findById(clienteId);
        Usuario usuario = usuarioService.findById(securityUtils.getUsuarioIdLogado());

        ModeloDocumento modelo = ModeloDocumento.builder()
                .cliente(cliente)
                .nome(dto.nome().trim())
                .descricao(dto.descricao() != null ? dto.descricao().trim() : null)
                .conteudo(dto.conteudo())
                .ativo(dto.ativo() != null ? dto.ativo() : true)
                .createdBy(usuario)
                .build();

        log.info("Criando modelo de documento '{}' para cliente {}", modelo.getNome(), clienteId);
        return ModeloDocumentoMapper.toDto(modeloDocumentoRepository.save(modelo));
    }

    @Transactional
    public ModeloDocumentoResponseDto update(Long id, ModeloDocumentoUpdateDto dto) {
        Long clienteId = securityUtils.getClienteIdLogado();
        ModeloDocumento modelo = findById(id);
        Usuario usuario = usuarioService.findById(securityUtils.getUsuarioIdLogado());

        if (dto.nome() != null && !dto.nome().isBlank()) {
            if (modeloDocumentoRepository.existsByNomeIgnoreCaseAndClienteIdAndIdNot(dto.nome(), clienteId, id)) {
                throw new ConflictException("Já existe um modelo de documento com esse nome, verifique!");
            }
            modelo.setNome(dto.nome().trim());
        }
        if (dto.descricao() != null) modelo.setDescricao(dto.descricao().trim());
        if (dto.conteudo()  != null && !dto.conteudo().isBlank()) modelo.setConteudo(dto.conteudo());
        if (dto.ativo()     != null) modelo.setAtivo(dto.ativo());

        modelo.setUpdatedBy(usuario);

        log.info("Atualizando modelo de documento {} para cliente {}", id, clienteId);
        return ModeloDocumentoMapper.toDto(modeloDocumentoRepository.save(modelo));
    }

    @Transactional
    public ModeloDocumentoResponseDto toggleAtivo(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        ModeloDocumento modelo = findById(id);
        Usuario usuario = usuarioService.findById(securityUtils.getUsuarioIdLogado());

        modelo.setAtivo(!Boolean.TRUE.equals(modelo.getAtivo()));
        modelo.setUpdatedBy(usuario);

        log.info("Alternando ativo do modelo de documento {} para {} (cliente {})", id, modelo.getAtivo(), clienteId);
        return ModeloDocumentoMapper.toDto(modeloDocumentoRepository.save(modelo));
    }
}
