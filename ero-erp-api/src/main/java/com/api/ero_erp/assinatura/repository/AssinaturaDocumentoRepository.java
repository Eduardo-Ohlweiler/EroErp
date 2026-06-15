package com.api.ero_erp.assinatura.repository;

import com.api.ero_erp.assinatura.entity.AssinaturaDocumento;
import com.api.ero_erp.assinatura.entity.AssinaturaStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssinaturaDocumentoRepository extends JpaRepository<AssinaturaDocumento, Long> {

    Optional<AssinaturaDocumento> findByToken(String token);

    List<AssinaturaDocumento> findByDocumentoIdAndClienteIdOrderByCreatedAtDesc(Long documentoId, Long clienteId);

    Optional<AssinaturaDocumento> findFirstByDocumentoIdAndClienteIdOrderByCreatedAtDesc(Long documentoId, Long clienteId);

    List<AssinaturaDocumento> findByDocumentoIdAndClienteIdAndStatusIn(Long documentoId, Long clienteId, List<AssinaturaStatus> statuses);
}
