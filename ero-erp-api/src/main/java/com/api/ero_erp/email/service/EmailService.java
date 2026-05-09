package com.api.ero_erp.email.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.cliente.service.ClienteService;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.email.dtos.EmailCreateDto;
import com.api.ero_erp.email.dtos.EmailResponseDto;
import com.api.ero_erp.email.entity.Email;
import com.api.ero_erp.email.mapper.EmailMapper;
import com.api.ero_erp.email.repository.EmailRepository;
import com.api.ero_erp.exceptions.ConflictException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.pessoa.service.PessoaService;
import com.api.ero_erp.tipoemail.entity.TipoEmail;
import com.api.ero_erp.tipoemail.service.TipoEmailService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EmailService {

    private final EmailRepository   emailRepository;
    private final TipoEmailService  tipoEmailService;
    private final SecurityUtils     securityUtils;
    private final ClienteService    clienteService;
    private final PessoaService     pessoaService;

    public EmailService(
            EmailRepository     emailRepository,
            TipoEmailService    tipoEmailService,
            SecurityUtils       securityUtils,
            ClienteService      clienteService,
            PessoaService       pessoaService
    ) {
        this.emailRepository  = emailRepository;
        this.tipoEmailService = tipoEmailService;
        this.securityUtils    = securityUtils;
        this.clienteService   = clienteService;
        this.pessoaService    = pessoaService;
    }

    @Transactional(readOnly = true)
    public Email findById(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return emailRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Email não encontrado"));
    }

    @Transactional(readOnly = true)
    public EmailResponseDto findByIdResponse(Long id) {
        return EmailMapper.toDto(this.findById(id));
    }

    @Transactional(readOnly = true)
    public List<EmailResponseDto> findByPessoaIdAndClienteId(Long pessoaId) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return EmailMapper.toDtoList(
                this.emailRepository.findByPessoaIdAndClienteId(pessoaId, clienteId)
        );
    }

    @Transactional
    public void delete(Long id) {
        Email email = this.findById(id);
        this.emailRepository.delete(email);
    }

    /*
    @Transactional
    public EmailResponseDto create(EmailCreateDto dto) {

        Cliente cliente     = this.clienteService.findById(securityUtils.getClienteIdLogado());
        TipoEmail tipoEmail = this.tipoEmailService.findById(dto.tipoEmailId());
        boolean principal   = Boolean.TRUE.equals(dto.principal());
        Pessoa pessoa       = pessoaService

        if (principal && emailRepository.existsByPessoaIdAndClienteIdAndPrincipalTrue(dto.pessoaId(), cliente.getId()))
            throw new ConflictException("Já existe um email principal para essa pessoa");

        boolean existeAlgumEmail = emailRepository.existsByPessoaIdAndClienteId(dto.pessoaId(), cliente.getId());
        if (!existeAlgumEmail)
            principal = true;

        Email email = new Email();

    }*/
}
