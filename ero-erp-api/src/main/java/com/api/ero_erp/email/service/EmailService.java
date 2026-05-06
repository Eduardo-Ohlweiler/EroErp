package com.api.ero_erp.email.service;

import com.api.ero_erp.email.entity.Email;
import com.api.ero_erp.email.repository.EmailRepository;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.usuario.service.UsuarioService;
import org.springframework.transaction.annotation.Transactional;

public class EmailService {

    private final EmailRepository emailRepository;
    private final UsuarioService  usuarioService;

    public EmailService(
            EmailRepository emailRepository,
            UsuarioService  usuarioService
    ) {
        this.emailRepository = emailRepository;
        this.usuarioService  = usuarioService;
    }

    @Transactional(readOnly = true)
    public Email findById(Long id) {
        return emailRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Email não encontrado"));
    }


}
