package com.api.ero_erp.loginlog.repository;

import com.api.ero_erp.loginlog.entity.LoginLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface LoginLogRepository extends JpaRepository<LoginLog, Long> {

    @Query("""
        SELECT ll FROM LoginLog ll
        WHERE (:clienteId IS NULL OR ll.cliente.id = :clienteId)
          AND (:usuarioId IS NULL OR ll.usuario.id = :usuarioId)
          AND (CAST(:inicio AS timestamp) IS NULL OR ll.dataLogin >= :inicio)
          AND (CAST(:fim    AS timestamp) IS NULL OR ll.dataLogin <= :fim)
    """)
    Page<LoginLog> findAllWithFilters(
            Pageable pageable,
            @Param("clienteId") Long          clienteId,
            @Param("usuarioId") Long          usuarioId,
            @Param("inicio")    LocalDateTime inicio,
            @Param("fim")       LocalDateTime fim
    );

    @Modifying
    @Query("""
        UPDATE LoginLog ll
        SET ll.dataLogout = :dataLogout, ll.tipoLogout = :tipoLogout, ll.updatedAt = :dataLogout
        WHERE ll.id = :sessionId AND ll.dataLogout IS NULL
    """)
    int fecharSessao(
            @Param("sessionId")  Long          sessionId,
            @Param("dataLogout") LocalDateTime dataLogout,
            @Param("tipoLogout") com.api.ero_erp.loginlog.entity.TipoLogout tipoLogout
    );
}
