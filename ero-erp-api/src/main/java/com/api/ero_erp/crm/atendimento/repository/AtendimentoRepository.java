package com.api.ero_erp.crm.atendimento.repository;

import com.api.ero_erp.crm.atendimento.entity.Atendimento;
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

    /**
     * Memória de vínculo: último atendimento (qualquer status) daquele número que
     * já teve uma pessoa vinculada. Usado para herdar a pessoa em novos atendimentos
     * do mesmo número, sem depender do telefone estar no cadastro da pessoa.
     */
    Optional<Atendimento> findFirstByClienteIdAndNumeroAndPessoaIsNotNullOrderByDataAberturaDesc(
            Long clienteId, String numero);

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

    /**
     * Listagem completa e paginada de atendimentos do cliente, ordenada da data de contato
     * (dataAbertura) mais recente para a mais antiga. Filtros opcionais: andamento, usuário
     * responsável, busca textual (nome da pessoa / nome do contato / número) e intervalo de
     * datas de abertura. Usa LEFT JOIN nas associações to-one (aliases) para não excluir
     * atendimentos sem pessoa/usuário e para preservar a semântica dos filtros nullable.
     */
    @Query(value = """
            SELECT a FROM Atendimento a
            LEFT JOIN FETCH a.andamento an
            LEFT JOIN FETCH a.usuario   u
            LEFT JOIN FETCH a.pessoa    p
            WHERE a.cliente.id = :clienteId
              AND (:andamentoId IS NULL OR an.id = :andamentoId)
              AND (:usuarioId   IS NULL OR u.id  = :usuarioId)
              AND (:busca IS NULL
                   OR LOWER(a.contatoNome) LIKE LOWER(CONCAT('%', CAST(:busca AS string), '%'))
                   OR a.numero             LIKE       CONCAT('%', CAST(:busca AS string), '%')
                   OR LOWER(p.nome)        LIKE LOWER(CONCAT('%', CAST(:busca AS string), '%')))
              AND a.dataAbertura >= COALESCE(:dataInicio, a.dataAbertura)
              AND a.dataAbertura <= COALESCE(:dataFim,    a.dataAbertura)
            ORDER BY a.dataAbertura DESC
            """,
            countQuery = """
            SELECT COUNT(a) FROM Atendimento a
            LEFT JOIN a.pessoa  p
            LEFT JOIN a.usuario u
            WHERE a.cliente.id = :clienteId
              AND (:andamentoId IS NULL OR a.andamento.id = :andamentoId)
              AND (:usuarioId   IS NULL OR u.id           = :usuarioId)
              AND (:busca IS NULL
                   OR LOWER(a.contatoNome) LIKE LOWER(CONCAT('%', CAST(:busca AS string), '%'))
                   OR a.numero             LIKE       CONCAT('%', CAST(:busca AS string), '%')
                   OR LOWER(p.nome)        LIKE LOWER(CONCAT('%', CAST(:busca AS string), '%')))
              AND a.dataAbertura >= COALESCE(:dataInicio, a.dataAbertura)
              AND a.dataAbertura <= COALESCE(:dataFim,    a.dataAbertura)
            """)
    Page<Atendimento> listarPaginado(
            @Param("clienteId")   Long          clienteId,
            @Param("andamentoId") Long          andamentoId,
            @Param("usuarioId")   Long          usuarioId,
            @Param("busca")       String        busca,
            @Param("dataInicio")  LocalDateTime dataInicio,
            @Param("dataFim")     LocalDateTime dataFim,
            Pageable pageable
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
