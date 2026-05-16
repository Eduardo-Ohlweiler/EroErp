package com.api.ero_erp.email.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.email.dtos.EmailItemDto;
import com.api.ero_erp.email.dtos.EmailResponseDto;
import com.api.ero_erp.email.entity.Email;
import com.api.ero_erp.email.mapper.EmailMapper;
import com.api.ero_erp.email.repository.EmailRepository;
import com.api.ero_erp.exceptions.BadRequestException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.tipoemail.entity.TipoEmail;
import com.api.ero_erp.tipoemail.service.TipoEmailService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class EmailService {

    private final EmailRepository   emailRepository;
    private final TipoEmailService  tipoEmailService;
    private final SecurityUtils     securityUtils;

    public EmailService(
            EmailRepository  emailRepository,
            TipoEmailService tipoEmailService,
            SecurityUtils    securityUtils
    ) {
        this.emailRepository  = emailRepository;
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

    @Transactional
    public void sincronizarEmails(Pessoa pessoa, List<EmailItemDto> dtos, Cliente cliente) {

        if (dtos == null || dtos.isEmpty()) {
            emailRepository.deleteAll(
                    emailRepository.findByPessoaIdAndClienteId(pessoa.getId(), cliente.getId())
            );
            return;
        }

        long quantidadePrincipais = dtos.stream()
                .filter(d -> Boolean.TRUE.equals(d.principal()))
                .count();
        if (quantidadePrincipais > 1)
            throw new BadRequestException("Apenas um email pode ser o principal");

        // IDs que vieram do front (só os que já existiam)
        Set<Long> idsRecebidos = dtos.stream()
                .filter(d -> d.id() != null)
                .map(EmailItemDto::id)
                .collect(Collectors.toSet());

        // Remove os que não vieram
        List<Email> existentes = emailRepository.findByPessoaIdAndClienteId(pessoa.getId(), cliente.getId());
        existentes.stream()
                .filter(e -> !idsRecebidos.contains(e.getId()))
                .forEach(emailRepository::delete);

        // Só um seja principal
        boolean temPrincipal = quantidadePrincipais == 1;

        for (int i = 0; i < dtos.size(); i++) {
            EmailItemDto dto = dtos.get(i);

            TipoEmail tipoEmail = tipoEmailService.findById(dto.tipoEmailId());
            boolean principal   = Boolean.TRUE.equals(dto.principal());

            // Se nenhum marcou principal, o primeiro vira principal
            if (!temPrincipal && i == 0) principal = true;

            if (dto.id() != null) {
                // Atualiza existente
                Email email = emailRepository.findByIdAndClienteId(dto.id(), cliente.getId())
                        .orElseThrow(() -> new NotFoundException("Email não encontrado"));
                email.setTipoEmail(tipoEmail);
                email.setEmail(dto.email());
                email.setObservacao(dto.observacao());
                email.setPrincipal(principal);
                Email salvo = emailRepository.save(email);

                pessoa.getEmails().removeIf(e -> e.getId().equals(salvo.getId()));
                pessoa.getEmails().add(salvo);
            } else {
                // Cria novo
                Email email = new Email();
                email.setCliente(cliente);
                email.setPessoa(pessoa);
                email.setTipoEmail(tipoEmail);
                email.setEmail(dto.email());
                email.setObservacao(dto.observacao());
                email.setPrincipal(principal);

                Email salvo = emailRepository.save(email);
                pessoa.getEmails().add(salvo);
            }
        }
    }
}
