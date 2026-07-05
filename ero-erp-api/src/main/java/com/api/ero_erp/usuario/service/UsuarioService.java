package com.api.ero_erp.usuario.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.cliente.service.ClienteService;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.exceptions.ConflictException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.grupoacesso.entity.GrupoAcesso;
import com.api.ero_erp.grupoacesso.repository.GrupoAcessoRepository;
import com.api.ero_erp.role.entity.Role;
import com.api.ero_erp.role.repository.RoleRepository;
import com.api.ero_erp.telefone.util.TelefoneUtils;
import com.api.ero_erp.usuario.dtos.PerfilUpdateDto;
import com.api.ero_erp.usuario.dtos.UsuarioCreateDto;
import com.api.ero_erp.usuario.dtos.UsuarioResponseDto;
import com.api.ero_erp.usuario.dtos.UsuarioUpdateDto;
import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.usuario.mapper.UsuarioMapper;
import com.api.ero_erp.usuario.repository.UsuarioRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class UsuarioService {

    private final UsuarioRepository     usuarioRepository;
    private final ClienteService        clienteService;
    private final RoleRepository        roleRepository;
    private final GrupoAcessoRepository grupoAcessoRepository;
    private final UsuarioMapper         usuarioMapper;
    private final PasswordEncoder       passwordEncoder;
    private final SecurityUtils         securityUtils;

    public UsuarioService(
            UsuarioRepository     usuarioRepository,
            ClienteService        clienteService,
            RoleRepository        roleRepository,
            GrupoAcessoRepository grupoAcessoRepository,
            UsuarioMapper         usuarioMapper,
            PasswordEncoder       passwordEncoder,
            SecurityUtils         securityUtils
    ) {
        this.usuarioRepository     = usuarioRepository;
        this.clienteService        = clienteService;
        this.roleRepository        = roleRepository;
        this.grupoAcessoRepository = grupoAcessoRepository;
        this.usuarioMapper         = usuarioMapper;
        this.passwordEncoder       = passwordEncoder;
        this.securityUtils         = securityUtils;
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponseDto> select(Long clienteId, String nome) {
        return usuarioRepository.findForSelect(clienteId, nome)
                .stream()
                .map(usuarioMapper::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponseDto> selectByClienteLogado(String nome) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return usuarioRepository.findForSelect(clienteId, nome)
                .stream()
                .map(usuarioMapper::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<UsuarioResponseDto> getAll(Pageable pageable, Long clienteId, String nome, String email) {
        return usuarioRepository.findAllWithFilters(pageable, clienteId, nome, email)
                .map(usuarioMapper::toDTO);
    }

    @Transactional(readOnly = true)
    public Usuario findById(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado, verifique!"));
    }

    public Usuario findByIdAndClienteId(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return usuarioRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado, verifique!"));
    }

    @Transactional(readOnly = true)
    public UsuarioResponseDto findByIdResponse(Long id) {
        return usuarioMapper.toDTO(this.findById(id));
    }

    @Transactional
    public UsuarioResponseDto create(Long clienteId, UsuarioCreateDto dto) {

        if (usuarioRepository.existsByEmailIgnoreCase(dto.email()))
            throw new ConflictException("Já existe usuário com esse email, verifique!");

        Cliente cliente = clienteService.findById(clienteId);
        if(!Boolean.TRUE.equals(cliente.getAtivo()))
            throw new ConflictException("Cliente inativo, verifique!");

        Long loggedId = getLoggedUserId();
        Usuario createdBy = loggedId != null ? this.findById(loggedId) : null;

        Set<Role> roles = new HashSet<>();

        if (dto.roleIds() != null) {
            roles = dto.roleIds().stream()
                    .map(nome -> roleRepository.findByNomeIgnoreCase(nome)
                            .orElseThrow(() -> new NotFoundException("Role não encontrada: " + nome)))
                    .collect(java.util.stream.Collectors.toSet());
        }

        Usuario usuario = new Usuario();
        usuario.setCliente(cliente);
        usuario.setNome(dto.nome());
        usuario.setEmail(dto.email());
        usuario.setSenha(passwordEncoder.encode(dto.senha()));
        usuario.setTelefone(dto.telefone());
        usuario.setCodigoPais(TelefoneUtils.defaultDdi(dto.codigoPais()));
        usuario.setRoles(roles);

        if (dto.grupoIds() != null)
            usuario.setGrupos(this.resolveGrupos(dto.grupoIds()));

        usuario.setCreatedBy(createdBy);

        return usuarioMapper.toDTO(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioResponseDto update(Long id, UsuarioUpdateDto dto) {

        Usuario usuario = this.findById(id);
        if (usuario.getCliente() == null || !Boolean.TRUE.equals(usuario.getCliente().getAtivo()))
            throw new ConflictException("Cliente inativo, verifique!");

        Long loggedId = getLoggedUserId();
        Usuario updatedBy = loggedId != null ? this.findById(loggedId) : null;

        if (dto.nome() != null && !dto.nome().isBlank())
            usuario.setNome(dto.nome());

        if (dto.telefone() != null && !dto.telefone().isBlank())
            usuario.setTelefone(dto.telefone());

        if (dto.codigoPais() != null && !dto.codigoPais().isBlank())
            usuario.setCodigoPais(TelefoneUtils.defaultDdi(dto.codigoPais()));

        if (dto.email() != null && !dto.email().isBlank()) {
            Optional<Usuario> salvo = usuarioRepository.findByEmailIgnoreCase(dto.email());
            if (salvo.isPresent() && !salvo.get().getId().equals(id))
                throw new ConflictException("Já existe outro usuário com esse email, verifique!");
            usuario.setEmail(dto.email());
        }

        if (dto.senha() != null && !dto.senha().isBlank())
            usuario.setSenha(passwordEncoder.encode(dto.senha()));

        if (dto.ativo() != null)
            usuario.setAtivo(dto.ativo());

        if(dto.clienteId() != null) {
            Cliente cliente = this.clienteService.findById(dto.clienteId());
            usuario.setCliente(cliente);
        }

        if (dto.roleIds() != null) {
            Set<Role> roles = dto.roleIds().stream()
                    .map(nome -> roleRepository.findByNomeIgnoreCase(nome)
                            .orElseThrow(() -> new NotFoundException("Role não encontrada: " + nome)))
                    .collect(java.util.stream.Collectors.toSet());

            usuario.setRoles(roles);
        }

        if (dto.grupoIds() != null)
            usuario.setGrupos(this.resolveGrupos(dto.grupoIds()));

        usuario.setUpdatedBy(updatedBy);

        return usuarioMapper.toDTO(usuarioRepository.save(usuario));
    }

    @Transactional(readOnly = true)
    public UsuarioResponseDto getPerfilLogado() {
        Long id = securityUtils.getUsuarioIdLogado();
        return this.findByIdResponse(id);
    }

    @Transactional
    public UsuarioResponseDto updatePerfil(PerfilUpdateDto dto) {

        Usuario usuario = this.findById(securityUtils.getUsuarioIdLogado());
        if (usuario.getCliente() == null || !Boolean.TRUE.equals(usuario.getCliente().getAtivo()))
            throw new ConflictException("Cliente inativo, verifique!");

        if (dto.nome() != null && !dto.nome().isBlank())
            usuario.setNome(dto.nome());

        if (dto.telefone() != null && !dto.telefone().isBlank())
            usuario.setTelefone(dto.telefone());

        if (dto.codigoPais() != null && !dto.codigoPais().isBlank())
            usuario.setCodigoPais(TelefoneUtils.defaultDdi(dto.codigoPais()));

        if (dto.email() != null && !dto.email().isBlank()) {
            Optional<Usuario> salvo = usuarioRepository.findByEmailIgnoreCase(dto.email());
            if (salvo.isPresent() && !salvo.get().getId().equals(usuario.getId()))
                throw new ConflictException("Já existe outro usuário com esse email, verifique!");
            usuario.setEmail(dto.email());
        }

        if (dto.novaSenha() != null && !dto.novaSenha().isBlank()) {
            if (dto.senhaAtual() == null || !passwordEncoder.matches(dto.senhaAtual(), usuario.getSenha()))
                throw new ConflictException("Senha atual incorreta, verifique!");
            usuario.setSenha(passwordEncoder.encode(dto.novaSenha()));
        }

        usuario.setUpdatedBy(usuario);

        return usuarioMapper.toDTO(usuarioRepository.save(usuario));
    }

    @Transactional
    public void delete(Long id) {
        usuarioRepository.delete(this.findById(id));
    }

    private Set<GrupoAcesso> resolveGrupos(Set<Long> grupoIds) {
        List<GrupoAcesso> grupos = grupoAcessoRepository.findAllById(grupoIds);
        if (grupos.size() != grupoIds.size())
            throw new NotFoundException("Grupo de acesso não encontrado, verifique!");
        return new HashSet<>(grupos);
    }

    private Long getLoggedUserId() {
        try {
            return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        } catch (Exception e) {
            return null;
        }
    }
}