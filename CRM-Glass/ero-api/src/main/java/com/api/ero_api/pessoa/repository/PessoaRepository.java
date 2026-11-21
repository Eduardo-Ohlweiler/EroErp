package com.api.ero_api.pessoa.repository;

import com.api.ero_api.pessoa.entity.Pessoa;
import com.api.ero_api.pessoa.enums.TipoPessoa;
import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Consultas de pessoa. O filtro de tenant é automático em todo JPQL. */
public interface PessoaRepository extends JpaRepository<Pessoa, UUID> {

    @Query("""
            SELECT p FROM Pessoa p
            WHERE p.id = :id
            """)
    Optional<Pessoa> buscarPorId(@Param("id") UUID id);

    /**
     * Lista com filtros (todos opcionais; o service já normalizou). {@code busca}: parte do
     * nome ou da fantasia, sem acento e sem caixa ({@code nome_busca}). {@code documento}:
     * parte do CPF ou do CNPJ, sem máscara. Sem JOIN FETCH: tipos e principais vêm em lote.
     */
    @Query("""
            SELECT p FROM Pessoa p
            WHERE (:codPessoa IS NULL OR p.codPessoa = :codPessoa)
              AND (:busca IS NULL OR p.nomeBusca LIKE CONCAT('%', CAST(:busca AS string), '%'))
              AND (:documento IS NULL
                   OR p.cpf LIKE CONCAT('%', CAST(:documento AS string), '%')
                   OR p.cnpj LIKE CONCAT('%', CAST(:documento AS string), '%'))
              AND (:tipoPessoa IS NULL OR p.tipoPessoa = :tipoPessoa)
              AND (:tipoCadastroId IS NULL OR EXISTS (
                   SELECT 1 FROM PessoaTipoCadastro x
                   WHERE x.pessoa = p AND x.tipoCadastro.id = :tipoCadastroId))
              AND (:ativo IS NULL OR p.ativo = :ativo)
            """)
    Page<Pessoa> buscarComFiltros(@Param("codPessoa") Long codPessoa, @Param("busca") String busca,
                                  @Param("documento") String documento, @Param("tipoPessoa") TipoPessoa tipoPessoa,
                                  @Param("tipoCadastroId") UUID tipoCadastroId, @Param("ativo") Boolean ativo,
                                  Pageable pageable);

    /**
     * Combo de pessoas: só as ativas, por nome. {@code busca} já normalizada; {@code ignorarId}
     * tira a própria pessoa (vínculo). O {@code limite} corta a lista.
     */
    @Query("""
            SELECT p FROM Pessoa p
            WHERE p.ativo = true
              AND (:busca IS NULL OR p.nomeBusca LIKE CONCAT('%', CAST(:busca AS string), '%'))
              AND (:ignorarId IS NULL OR p.id <> :ignorarId)
            ORDER BY p.nome
            """)
    List<Pessoa> buscarParaSelecao(@Param("busca") String busca, @Param("ignorarId") UUID ignorarId, Pageable limite);

    /**
     * Trava as pessoas (SELECT ... FOR UPDATE) em ordem de id: quem salva um vínculo trava
     * as duas pontas sempre na mesma ordem, e dois salvando A e B ao mesmo tempo esperam um
     * pelo outro em vez de entrar em deadlock. Id de outro contratante não volta.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT p FROM Pessoa p
            WHERE p.id IN :ids
            ORDER BY p.id
            """)
    List<Pessoa> travarPorIds(@Param("ids") Collection<UUID> ids);

    /** Próximo código do contratante. Nunca em contexto ROOT (pegaria o maior de todos os contratantes). */
    @Query("""
            SELECT COALESCE(MAX(p.codPessoa), 0) + 1 FROM Pessoa p
            """)
    long buscarProximoCodigo();

    /** Código de quem já tem o CPF no contratante (fora o próprio registro), para o 409 dizer qual. */
    @Query("""
            SELECT p.codPessoa FROM Pessoa p
            WHERE p.cpf = :cpf AND p.id <> :ignorarId
            """)
    Optional<Long> buscarCodigoPorCpf(@Param("cpf") String cpf, @Param("ignorarId") UUID ignorarId);

    @Query("""
            SELECT p.codPessoa FROM Pessoa p
            WHERE p.cnpj = :cnpj AND p.id <> :ignorarId
            """)
    Optional<Long> buscarCodigoPorCnpj(@Param("cnpj") String cnpj, @Param("ignorarId") UUID ignorarId);

    /**
     * Registra que algo da pessoa mudou (filhas, vínculos): confere a versão e incrementa num
     * comando só, com a linha já travada. 0 linhas = outra pessoa alterou antes (inclusive um
     * vínculo salvo pelo outro lado).
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            UPDATE VERSIONED Pessoa p
            SET p.updatedAt = :agora, p.updatedBy = :autor
            WHERE p.id = :id AND p.version = :versao
            """)
    int marcarAlteracao(@Param("id") UUID id, @Param("versao") Long versao,
                        @Param("agora") Instant agora, @Param("autor") UUID autor);

    /**
     * O vínculo destas pessoas mudou pelo cadastro de outra: sobe a versão delas, para a
     * ficha que estiver aberta do outro lado receber 409 em vez de apagar o vínculo em silêncio.
     */
    @Modifying(flushAutomatically = true)
    @Query("""
            UPDATE VERSIONED Pessoa p
            SET p.updatedAt = :agora, p.updatedBy = :autor
            WHERE p.id IN :ids
            """)
    int marcarAlteradaPorVinculo(@Param("ids") Collection<UUID> ids, @Param("agora") Instant agora,
                                 @Param("autor") UUID autor);
}
