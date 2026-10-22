package com.api.ero_erp.whatsapp.repository;

import com.api.ero_erp.whatsapp.entity.WhatsappServidor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/** Global, sem tenant: a linha única do servidor Evolution. */
@Repository
public interface WhatsappServidorRepository extends JpaRepository<WhatsappServidor, UUID> {

    Optional<WhatsappServidor> findFirstBy();
}
