package com.api.ero_erp.email.service;

import com.api.ero_erp.email.repository.EmailRepository;

public class EmailService {

    private final EmailRepository emailRepository;

    public EmailService(EmailRepository emailRepository) {
        this.emailRepository = emailRepository;
    }

}
