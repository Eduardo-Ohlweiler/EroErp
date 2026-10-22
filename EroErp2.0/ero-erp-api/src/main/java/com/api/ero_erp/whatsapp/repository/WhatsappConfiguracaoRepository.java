package com.api.ero_erp.whatsapp.repository;

import com.api.ero_erp.whatsapp.entity.WhatsappConfiguracao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WhatsappConfiguracaoRepository extends JpaRepository<WhatsappConfiguracao, UUID> {

    Optional<WhatsappConfiguracao> findByTenantId(UUID tenantId);
}
