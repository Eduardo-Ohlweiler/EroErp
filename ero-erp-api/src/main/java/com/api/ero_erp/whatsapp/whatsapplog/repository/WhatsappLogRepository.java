package com.api.ero_erp.whatsapp.whatsapplog.repository;

import com.api.ero_erp.whatsapp.whatsapplog.entity.WhatsappLog;
import com.api.ero_erp.whatsapp.whatsapplog.enums.WhatsappLogStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WhatsappLogRepository extends JpaRepository<WhatsappLog, Long> {

    @Query("""
            SELECT l FROM WhatsappLog l
            JOIN FETCH l.compromisso c
            JOIN FETCH l.usuario u
            JOIN FETCH l.cliente cl
            LEFT JOIN FETCH l.pessoa p
            WHERE l.status = :status
            """)
    List<WhatsappLog> findAllByStatusWithDetails(WhatsappLogStatus status);

    List<WhatsappLog> findAllByCompromissoIdAndStatus(Long compromissoId, WhatsappLogStatus status);
}
