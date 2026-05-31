package com.api.ero_erp.whatsapp.whatsappinstancia.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.cliente.service.ClienteService;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.exceptions.ConflictException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.usuario.service.UsuarioService;
import com.api.ero_erp.whatsapp.whatsappinstancia.dtos.WhatsappInstanciaCreateDto;
import com.api.ero_erp.whatsapp.whatsappinstancia.dtos.WhatsappInstanciaResponseDto;
import com.api.ero_erp.whatsapp.whatsappinstancia.dtos.WhatsappInstanciaUpdateDto;
import com.api.ero_erp.whatsapp.whatsappinstancia.entity.WhatsappInstancia;
import com.api.ero_erp.whatsapp.whatsappinstancia.mapper.WhatsappInstanciaMapper;
import com.api.ero_erp.whatsapp.whatsappinstancia.repository.WhatsappInstanciaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class WhatsappInstanciaService {

    private final WhatsappInstanciaRepository whatsappInstanciaRepository;
    private final ClienteService              clienteService;
    private final UsuarioService              usuarioService;
    private final SecurityUtils               securityUtils;

    public WhatsappInstanciaService(
            WhatsappInstanciaRepository whatsappInstanciaRepository,
            ClienteService              clienteService,
            UsuarioService              usuarioService,
            SecurityUtils               securityUtils
    ) {
        this.whatsappInstanciaRepository = whatsappInstanciaRepository;
        this.clienteService              = clienteService;
        this.usuarioService              = usuarioService;
        this.securityUtils               = securityUtils;
    }

    @Transactional
    public WhatsappInstanciaResponseDto create(WhatsappInstanciaCreateDto dto) {
        Long clienteId  = securityUtils.getClienteIdLogado();
        Cliente cliente = clienteService.findById(clienteId);
        Usuario usuario = usuarioService.findByIdAndClienteId(dto.usuarioId());

        if (whatsappInstanciaRepository.existsByUsuarioIdAndClienteId(usuario.getId(), clienteId))
            throw new ConflictException("Este usuário já possui uma instância configurada, verifique!");
        if (whatsappInstanciaRepository.existsByInstanceNameAndClienteId(dto.instanceName(), clienteId))
            throw new ConflictException("Já existe uma instância com esse nome na Evolution API para este cliente, verifique!");

        WhatsappInstancia instancia = new WhatsappInstancia();
        instancia.setCliente(cliente);
        instancia.setUsuario(usuario);
        instancia.setNome(dto.nome());
        instancia.setInstanceName(dto.instanceName());
        instancia.setToken(dto.token());
        if (dto.timezone() != null)
            instancia.setTimezone(dto.timezone());
        if (dto.antecedenciaMinutos() != null)
            instancia.setAntecedenciaMinutos(dto.antecedenciaMinutos());
        if (dto.ativo() != null)
            instancia.setAtivo(dto.ativo());

        return WhatsappInstanciaMapper.toDto(whatsappInstanciaRepository.save(instancia));
    }

    @Transactional(readOnly = true)
    public WhatsappInstancia findById(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return whatsappInstanciaRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Instância do WhatsApp não encontrada, verifique!"));
    }

    @Transactional(readOnly = true)
    public WhatsappInstanciaResponseDto findByIdResponse(Long id) {
        return WhatsappInstanciaMapper.toDto(this.findById(id));
    }

    @Transactional(readOnly = true)
    public List<WhatsappInstanciaResponseDto> getAll() {
        Long clienteId = securityUtils.getClienteIdLogado();
        return whatsappInstanciaRepository.findByClienteId(clienteId)
                .stream()
                .map(WhatsappInstanciaMapper::toDto)
                .toList();
    }

    @Transactional
    public WhatsappInstanciaResponseDto update(Long id, WhatsappInstanciaUpdateDto dto) {
        Long clienteId = securityUtils.getClienteIdLogado();

        WhatsappInstancia instancia = whatsappInstanciaRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Instância do WhatsApp não encontrada, verifique!"));

        if (dto.usuarioId() != null && !dto.usuarioId().equals(instancia.getUsuario().getId())) {
            if (whatsappInstanciaRepository.existsByUsuarioIdAndClienteId(dto.usuarioId(), clienteId))
                throw new ConflictException("Este usuário já possui uma instância configurada, verifique!");

            Usuario novoUsuario = usuarioService.findByIdAndClienteId(dto.usuarioId());
            instancia.setUsuario(novoUsuario);
        }

        if (dto.nome() != null && !dto.nome().isBlank())
            instancia.setNome(dto.nome());
        if (dto.token() != null && !dto.token().isBlank())
            instancia.setToken(dto.token());
        if (dto.timezone() != null)
            instancia.setTimezone(dto.timezone());
        if (dto.antecedenciaMinutos() != null)
            instancia.setAntecedenciaMinutos(dto.antecedenciaMinutos());
        if (dto.ativo() != null)
            instancia.setAtivo(dto.ativo());

        return WhatsappInstanciaMapper.toDto(whatsappInstanciaRepository.save(instancia));
    }

    @Transactional
    public void delete(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();

        WhatsappInstancia instancia = whatsappInstanciaRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Instância do WhatsApp não encontrada, verifique!"));

        whatsappInstanciaRepository.delete(instancia);
    }
}
