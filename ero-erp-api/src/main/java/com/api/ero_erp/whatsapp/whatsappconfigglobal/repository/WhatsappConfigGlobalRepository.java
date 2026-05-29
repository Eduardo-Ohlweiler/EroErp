package com.api.ero_erp.whatsapp.whatsappconfigglobal.repository;

import com.api.ero_erp.whatsapp.whatsappconfigglobal.entity.WhatsappConfigGlobal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WhatsappConfigGlobalRepository extends JpaRepository<WhatsappConfigGlobal, Long> {

    Optional<WhatsappConfigGlobal> findFirstByAtivoTrue();
}
