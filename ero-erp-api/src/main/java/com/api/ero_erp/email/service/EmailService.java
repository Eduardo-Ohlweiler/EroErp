package com.api.ero_erp.email.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.email.dtos.EmailResponseDto;
import com.api.ero_erp.email.entity.Email;
import com.api.ero_erp.email.mapper.EmailMapper;
import com.api.ero_erp.email.repository.EmailRepository;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.tipoemail.service.TipoEmailService;
import com.api.ero_erp.usuario.service.UsuarioService;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public class EmailService {

    private final EmailRepository   emailRepository;
    private final UsuarioService    usuarioService;
    private final TipoEmailService  tipoEmailService;
    private final SecurityUtils     securityUtils;

    public EmailService(
            EmailRepository     emailRepository,
            UsuarioService      usuarioService,
            TipoEmailService    tipoEmailService,
            SecurityUtils    securityUtils
    ) {
        this.emailRepository =  emailRepository;
        this.usuarioService  =  usuarioService;
        this.tipoEmailService = tipoEmailService;
        this.securityUtils    = securityUtils;
    }

    @Transactional(readOnly = true)
    public Email findById(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return emailRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Email não encontrado"));
    }

    @Transactional(readOnly = true)
    public EmailResponseDto findByEmailResponse(Long id) {
        return EmailMapper.toDto(this.findById(id));
    }

    @Transactional(readOnly = true)
    public List<EmailResponseDto> findByPessoaIdAndClienteId(Long pessoaId) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return EmailMapper.toDtoList(
                this.emailRepository.findByPessoaIdAndClienteId(pessoaId, clienteId)
        );
    }
}
