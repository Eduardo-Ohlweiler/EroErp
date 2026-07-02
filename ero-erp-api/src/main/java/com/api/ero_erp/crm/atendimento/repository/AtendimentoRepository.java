package com.api.ero_erp.crm.atendimento.repository;

import com.api.ero_erp.crm.atendimento.entity.Atendimento;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AtendimentoRepository extends JpaRepository<Atendimento, Long> {

    /**
     * Atendimento aberto (ativo) de um número específico para o cliente.
     * Regra de negócio: no máximo um aberto por (cliente, numero).
     */
    @Query("""
            SELECT a FROM Atendimento a
            WHERE a.cliente.id = :clienteId
              AND a.numero = :numero
              AND a.ativo = true
              AND a.dataConclusao IS NULL
            ORDER BY a.dataAbertura DESC
            """)
    List<Atendimento> findAbertosByClienteAndNumero(
            @Param("clienteId") Long clienteId,
            @Param("numero")    String numero
    );

    /** Kanban: atendimentos do cliente com filtros opcionais de usuário e andamento. */
    @Query("""
            SELECT a FROM Atendimento a
            LEFT JOIN FETCH a.andamento
            LEFT JOIN FETCH a.usuario
            LEFT JOIN FETCH a.pessoa
            WHERE a.cliente.id = :clienteId
              AND a.ativo = true
              AND (:usuarioId   IS NULL OR a.usuario.id   = :usuarioId)
              AND (:andamentoId IS NULL OR a.andamento.id = :andamentoId)
            ORDER BY a.dataUltimaMensagem DESC NULLS LAST, a.dataAbertura DESC
            """)
    List<Atendimento> listarKanban(
            @Param("clienteId")   Long clienteId,
            @Param("usuarioId")   Long usuarioId,
            @Param("andamentoId") Long andamentoId
    );

    /**
     * Kanban (carregamento normal): os N atendimentos finalizados (concluído/cancelado)
     * mais recentes do cliente, para preencher as colunas terminais sem poluir. Limite via Pageable.
     */
    @Query("""
            SELECT a FROM Atendimento a
            LEFT JOIN FETCH a.andamento
            LEFT JOIN FETCH a.usuario
            LEFT JOIN FETCH a.pessoa
            WHERE a.cliente.id = :clienteId
              AND a.ativo = false
              AND (:usuarioId IS NULL OR a.usuario.id = :usuarioId)
            ORDER BY a.dataConclusao DESC NULLS LAST, a.dataUltimaMensagem DESC NULLS LAST
            """)
    List<Atendimento> listarUltimosFinalizados(
            @Param("clienteId") Long clienteId,
            @Param("usuarioId") Long usuarioId,
            Pageable pageable
    );

    /**
     * Kanban (filtro por andamento terminal): finalizados de um andamento a partir de uma data
     * (ex.: últimos 5 dias). Pageable usado apenas como teto de segurança.
     */
    @Query("""
            SELECT a FROM Atendimento a
            LEFT JOIN FETCH a.andamento
            LEFT JOIN FETCH a.usuario
            LEFT JOIN FETCH a.pessoa
            WHERE a.cliente.id = :clienteId
              AND a.ativo = false
              AND a.andamento.id = :andamentoId
              AND (:usuarioId IS NULL OR a.usuario.id = :usuarioId)
              AND a.dataConclusao >= :dataMinima
            ORDER BY a.dataConclusao DESC NULLS LAST, a.dataUltimaMensagem DESC NULLS LAST
            """)
    List<Atendimento> listarFinalizadosPorAndamentoDesde(
            @Param("clienteId")   Long clienteId,
            @Param("usuarioId")   Long usuarioId,
            @Param("andamentoId") Long andamentoId,
            @Param("dataMinima")  LocalDateTime dataMinima,
            Pageable pageable
    );

    @Query("""
            SELECT a FROM Atendimento a
            LEFT JOIN FETCH a.andamento
            LEFT JOIN FETCH a.usuario
            LEFT JOIN FETCH a.pessoa
            WHERE a.id = :id AND a.cliente.id = :clienteId
            """)
    Optional<Atendimento> findByIdAndClienteId(
            @Param("id")        Long id,
            @Param("clienteId") Long clienteId
    );

    /** Atendimentos abertos de um cliente com resposta do cliente (base das pendências). */
    @Query("""
            SELECT a FROM Atendimento a
            WHERE a.cliente.id = :clienteId
              AND a.ativo = true
              AND a.dataConclusao IS NULL
              AND a.dataUltimaMensagemCliente IS NOT NULL
            """)
    List<Atendimento> findAbertosComRespostaCliente(@Param("clienteId") Long clienteId);
}
