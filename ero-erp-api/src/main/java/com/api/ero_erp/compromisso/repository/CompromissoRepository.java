package com.api.ero_erp.compromisso.repository;
/*
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
public interface CompromissoRepository extends JpaRepository<Compromisso, Long> {

    Optional<Compromisso> findByIdAndClienteId(Long id, Long clienteId);

    // ─── Calendário: eventos no período ──────────────────────────────────────
    @Query("""
        SELECT c FROM Compromisso c
            LEFT JOIN FETCH c.pessoa p
            LEFT JOIN FETCH c.usuario u
        WHERE c.cliente.id = :clienteId
            AND c.inicio   < :fim
            AND c.fim      > :inicio
        ORDER BY c.inicio
    """)
    List<Compromisso> findByPeriodo(
            @Param("clienteId") Long          clienteId,
            @Param("inicio")    LocalDateTime inicio,
            @Param("fim")       LocalDateTime fim
    );

    // ─── Lista paginada com filtros ───────────────────────────────────────────
    @Query("""
        SELECT c FROM Compromisso c
            LEFT JOIN c.pessoa p
            LEFT JOIN c.usuario u
        WHERE c.cliente.id = :clienteId
            AND (:titulo    IS NULL OR LOWER(c.titulo) LIKE LOWER(CONCAT('%', CAST(:titulo AS string), '%')))
            AND (:pessoaId  IS NULL OR p.id            = :pessoaId)
            AND (:usuarioId IS NULL OR u.id            = :usuarioId)
            AND (:cancelado IS NULL OR c.cancelado      = :cancelado)
            AND (:concluido IS NULL OR c.concluido      = :concluido)
            AND (:inicio    IS NULL OR c.inicio        >= :inicio)
            AND (:fim       IS NULL OR c.fim           <= :fim)
    """)
    Page<Compromisso> findAllWithFilters(
            Pageable pageable,
            @Param("clienteId")  Long          clienteId,
            @Param("titulo")     String        titulo,
            @Param("pessoaId")   Long          pessoaId,
            @Param("usuarioId")  Long          usuarioId,
            @Param("cancelado")  Boolean       cancelado,
            @Param("concluido")  Boolean       concluido,
            @Param("inicio")     LocalDateTime inicio,
            @Param("fim")        LocalDateTime fim
    );

    // ─── Validação de conflito ────────────────────────────────────────────────
    @Query("""
        SELECT COUNT(c) > 0 FROM Compromisso c
        WHERE c.cliente.id  = :clienteId
            AND c.cancelado = false
            AND c.concluido = false
            AND c.inicio    < :fim
            AND c.fim       > :inicio
            AND (:excludeId IS NULL OR c.id <> :excludeId)
    """)
    boolean existsConflict(
            @Param("clienteId")  Long          clienteId,
            @Param("inicio")     LocalDateTime inicio,
            @Param("fim")        LocalDateTime fim,
            @Param("excludeId")  Long          excludeId
    );

    // ─── Filhos de uma série de recorrência ──────────────────────────────────
    List<Compromisso> findByCompromissoPaiIdOrderByInicio(Long compromissoPaiId);
}*/

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
public interface CompromissoRepository extends JpaRepository<Compromisso, Long> {

    Optional<Compromisso> findByIdAndClienteId(Long id, Long clienteId);

    // ─── Calendário: eventos no período ──────────────────────────────────────
    @Query("""
        SELECT c FROM Compromisso c
            LEFT JOIN FETCH c.emitente  em
            LEFT JOIN FETCH em.pessoa   emp
            LEFT JOIN FETCH c.pessoa    p
            LEFT JOIN FETCH c.usuario   u
        WHERE c.cliente.id = :clienteId
            AND c.inicio   < :fim
            AND c.fim      > :inicio
        ORDER BY c.inicio
    """)
    List<Compromisso> findByPeriodo(
            @Param("clienteId") Long          clienteId,
            @Param("inicio")    LocalDateTime inicio,
            @Param("fim")       LocalDateTime fim
    );

    // ─── Lista paginada com filtros ───────────────────────────────────────────
    @Query("""
        SELECT c FROM Compromisso c
            LEFT JOIN c.emitente  em
            LEFT JOIN c.pessoa    p
            LEFT JOIN c.usuario   u
        WHERE c.cliente.id = :clienteId
            AND (:titulo     IS NULL OR LOWER(c.titulo) LIKE LOWER(CONCAT('%', CAST(:titulo AS string), '%')))
            AND (:emitenteId IS NULL OR em.id           = :emitenteId)
            AND (:pessoaId   IS NULL OR p.id            = :pessoaId)
            AND (:usuarioId  IS NULL OR u.id            = :usuarioId)
            AND (:cancelado  IS NULL OR c.cancelado     = :cancelado)
            AND (:concluido  IS NULL OR c.concluido     = :concluido)
            AND (:inicio     IS NULL OR c.inicio       >= :inicio)
            AND (:fim        IS NULL OR c.fim          <= :fim)
    """)
    Page<Compromisso> findAllWithFilters(
            Pageable pageable,
            @Param("clienteId")  Long          clienteId,
            @Param("titulo")     String        titulo,
            @Param("emitenteId") Long          emitenteId,
            @Param("pessoaId")   Long          pessoaId,
            @Param("usuarioId")  Long          usuarioId,
            @Param("cancelado")  Boolean       cancelado,
            @Param("concluido")  Boolean       concluido,
            @Param("inicio")     LocalDateTime inicio,
            @Param("fim")        LocalDateTime fim
    );

    // ─── Validação de conflito — global por cliente ───────────────────────────
    @Query("""
        SELECT COUNT(c) > 0 FROM Compromisso c
        WHERE c.cliente.id  = :clienteId
            AND c.cancelado = false
            AND c.concluido = false
            AND c.inicio    < :fim
            AND c.fim       > :inicio
            AND (:excludeId IS NULL OR c.id <> :excludeId)
    """)
    boolean existsConflict(
            @Param("clienteId")  Long          clienteId,
            @Param("inicio")     LocalDateTime inicio,
            @Param("fim")        LocalDateTime fim,
            @Param("excludeId")  Long          excludeId
    );

    // ─── Filhos de uma série ──────────────────────────────────────────────────
    List<Compromisso> findByCompromissoPaiIdOrderByInicio(Long compromissoPaiId);

    // ─── Dashboard: contagens ─────────────────────────────────────────────────
    long countByClienteIdAndCanceladoFalseAndConcluidoFalse(Long clienteId);
    long countByClienteIdAndCanceladoTrue(Long clienteId);
    long countByClienteIdAndConcluidoTrue(Long clienteId);

    @Query("""
        SELECT COUNT(c) FROM Compromisso c
        WHERE c.cliente.id = :clienteId
          AND c.cancelado  = false
          AND c.inicio    >= :inicio
          AND c.inicio     < :fim
        """)
    long countNoPeriodo(
            @Param("clienteId") Long          clienteId,
            @Param("inicio")    LocalDateTime inicio,
            @Param("fim")       LocalDateTime fim
    );

    // ─── Dashboard: próximos hoje ─────────────────────────────────────────────
    @Query("""
        SELECT c FROM Compromisso c
            LEFT JOIN FETCH c.pessoa p
        WHERE c.cliente.id = :clienteId
          AND c.cancelado  = false
          AND c.concluido  = false
          AND c.inicio    >= :agora
          AND c.inicio     < :fimDia
        ORDER BY c.inicio
        """)
    List<Compromisso> findProximosHoje(
            @Param("clienteId") Long          clienteId,
            @Param("agora")     LocalDateTime agora,
            @Param("fimDia")    LocalDateTime fimDia
    );

    // ─── Dashboard: top pessoas ───────────────────────────────────────────────
    @Query("""
        SELECT c.pessoa.nome, COUNT(c)
        FROM Compromisso c
        WHERE c.cliente.id  = :clienteId
          AND c.cancelado   = false
          AND c.pessoa      IS NOT NULL
        GROUP BY c.pessoa.nome
        ORDER BY COUNT(c) DESC
        """)
    List<Object[]> findTopPessoas(@Param("clienteId") Long clienteId, Pageable pageable);

    // ─── Dashboard: compromissos no período (leve, só id+inicio) ─────────────
    @Query("""
        SELECT c.inicio FROM Compromisso c
        WHERE c.cliente.id = :clienteId
          AND c.cancelado  = false
          AND c.inicio    >= :inicio
          AND c.inicio     < :fim
        ORDER BY c.inicio
        """)
    List<LocalDateTime> findIniciosNoPeriodo(
            @Param("clienteId") Long          clienteId,
            @Param("inicio")    LocalDateTime inicio,
            @Param("fim")       LocalDateTime fim
    );
}
