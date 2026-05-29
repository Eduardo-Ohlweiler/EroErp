package com.api.ero_erp.whatsapp.whatsappinstancia.repository;

import com.api.ero_erp.whatsapp.whatsappinstancia.entity.WhatsappInstancia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WhatsappInstanciaRepository extends JpaRepository<WhatsappInstancia, Long> {

    Optional<WhatsappInstancia> findByIdAndClienteId(Long id, Long clienteId);

    boolean existsByInstanceNameAndClienteId(String instanceName, Long clienteId);

    List<WhatsappInstancia> findByClienteIdAndAtivoTrue(Long clienteId);
}
