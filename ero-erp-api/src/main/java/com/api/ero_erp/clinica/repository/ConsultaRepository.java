package com.api.ero_erp.clinica.repository;

import com.api.ero_erp.clinica.entity.Consulta;
import com.api.ero_erp.clinica.enums.StatusConsulta;
import com.api.ero_erp.compromisso.entity.Compromisso;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ConsultaRepository extends JpaRepository<Consulta, Long> {

    @Query("""
            SELECT c FROM Consulta c
            JOIN FETCH c.emitente e JOIN FETCH e.pessoa
            JOIN FETCH c.pessoa
            WHERE c.id = :id
            AND c.cliente.id = :clienteId
            """)
    Optional<Consulta> findByIdAndClienteId(
            @Param("id")        Long id,
            @Param("clienteId") Long clienteId
    );

    @Query("""
            SELECT c FROM Consulta c
            JOIN FETCH c.pessoa
            WHERE c.cliente.id = :clienteId
            AND c.status = 'CONCLUIDA'
            AND c.inicio >= :desde
            ORDER BY c.inicio ASC
            """)
    List<Consulta> findConcluidasForDashboard(
            @Param("clienteId") Long          clienteId,
            @Param("desde")     LocalDateTime desde
    );

    @Query("""
            SELECT c FROM Consulta c
            JOIN FETCH c.emitente e JOIN FETCH e.pessoa
            JOIN FETCH c.pessoa p
            WHERE c.cliente.id = :clienteId
            AND (:status IS NULL OR c.status = :status)
            AND (:emitenteId IS NULL OR c.emitente.id = :emitenteId)
            AND (:pessoaId IS NULL OR c.pessoa.id = :pessoaId)
            AND c.inicio >= :inicio
            AND c.inicio <= :fim
            AND (:nomePessoa IS NULL OR LOWER(p.nome) LIKE LOWER(CONCAT('%', CAST(:nomePessoa AS string), '%')))
            AND (:faturado IS NULL OR c.faturado = :faturado)
            ORDER BY c.createdAt DESC
            """)
    Page<Consulta> findAllWithFilters(
            Pageable pageable,
            @Param("clienteId")  Long           clienteId,
            @Param("status")     StatusConsulta status,
            @Param("emitenteId") Long           emitenteId,
            @Param("pessoaId")   Long           pessoaId,
            @Param("inicio")     LocalDateTime  inicio,
            @Param("fim")        LocalDateTime  fim,
            @Param("nomePessoa") String         nomePessoa,
            @Param("faturado")   Boolean        faturado
    );

    @Query("""
            SELECT c FROM Consulta c
            JOIN FETCH c.emitente em JOIN FETCH em.pessoa
            JOIN FETCH c.pessoa
            LEFT JOIN FETCH c.consultaPai
            WHERE c.cliente.id = :clienteId
            AND c.inicio >= :desde
            AND c.inicio <= :ate
            AND (:emitenteId IS NULL OR c.emitente.id = :emitenteId)
            AND (:status IS NULL OR c.status = :status)
            AND (:pessoaId IS NULL OR c.pessoa.id = :pessoaId)
            ORDER BY c.inicio ASC
            """)
    List<Consulta> findForDashboardAnalitico(
            @Param("clienteId")  Long           clienteId,
            @Param("desde")      LocalDateTime  desde,
            @Param("ate")        LocalDateTime  ate,
            @Param("emitenteId") Long           emitenteId,
            @Param("status")     StatusConsulta status,
            @Param("pessoaId")   Long           pessoaId
    );

    // ── Compromissos da agenda disponíveis para vincular a uma consulta ─────────
    // Futuros, não cancelados, não concluídos e que ainda não estão atrelados a
    // nenhuma consulta. Mantido neste repositório (módulo clínica) porque a
    // direção da dependência é clínica → compromisso.
    @Query("""
            SELECT c FROM Compromisso c
                LEFT JOIN FETCH c.pessoa p
            WHERE c.cliente.id = :clienteId
                AND c.cancelado = false
                AND c.concluido = false
                AND c.inicio   >= :agora
                AND NOT EXISTS (SELECT 1 FROM Consulta cons WHERE cons.compromisso.id = c.id)
            ORDER BY c.inicio ASC
            """)
    List<Compromisso> findCompromissosDisponiveis(
            @Param("clienteId") Long          clienteId,
            @Param("agora")     LocalDateTime agora
    );

    boolean existsByCompromissoId(Long compromissoId);

    List<Consulta> findByFichaAnamneseId(Long fichaAnamneseId);
}
