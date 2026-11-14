package com.api.ero_api.usuario.repository;

import com.api.ero_api.compartilhado.entity.SqlNativoRevisado;
import com.api.ero_api.tenant.enums.TemaInterface;
import com.api.ero_api.usuario.dtos.UsuarioSelectDto;
import com.api.ero_api.usuario.entity.Usuario;
import com.api.ero_api.usuario.enums.Papel;
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

/**
 * Consultas de usuário. O filtro de tenant é automático em todo JPQL.
 * Superadmin nunca aparece nas listas de um contratante.
 */
@SqlNativoRevisado("E-mail é único no sistema todo; a checagem precisa enxergar todos os tenants.")
public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

    @Query("""
            SELECT u FROM Usuario u
            WHERE u.id = :id
            """)
    Optional<Usuario> buscarPorId(@Param("id") UUID id);

    /**
     * {@code bloqueado}: {@code true} = bloqueado por excesso de tentativas agora
     * ({@code bloqueadoAte} depois de {@code agora}); {@code false} = não bloqueado
     * (nunca foi ou o prazo já passou); {@code null} = tanto faz.
     */
    @Query("""
            SELECT u FROM Usuario u
            WHERE u.papel <> com.api.ero_api.usuario.enums.Papel.SUPERADMIN
              AND (:ativo IS NULL OR u.ativo = :ativo)
              AND (:papel IS NULL OR u.papel = :papel)
              AND (:bloqueado IS NULL
                   OR (:bloqueado = true AND u.bloqueadoAte > :agora)
                   OR (:bloqueado = false AND (u.bloqueadoAte IS NULL OR u.bloqueadoAte <= :agora)))
              AND (:busca IS NULL
                   OR LOWER(u.nome) LIKE LOWER(CONCAT('%', CAST(:busca AS string), '%'))
                   OR LOWER(u.email) LIKE LOWER(CONCAT('%', CAST(:busca AS string), '%')))
            """)
    Page<Usuario> buscarComFiltros(@Param("busca") String busca, @Param("ativo") Boolean ativo,
                                   @Param("papel") Papel papel, @Param("bloqueado") Boolean bloqueado,
                                   @Param("agora") Instant agora, Pageable pageable);

    /** Combos: só os ativos, ou também os inativos (filtro "Usuário" da tela Logs). */
    @Query("""
            SELECT u FROM Usuario u
            WHERE (:incluirInativos = true OR u.ativo = true)
              AND u.papel <> com.api.ero_api.usuario.enums.Papel.SUPERADMIN
            ORDER BY u.nome
            """)
    List<Usuario> buscarParaSelecao(@Param("incluirInativos") boolean incluirInativos);

    /**
     * Administradores ativos do contratante atual (filtro automático de tenant), para a
     * regra de que o contratante nunca fica sem administrador. O superadmin não conta.
     */
    @Query("""
            SELECT COUNT(u) FROM Usuario u
            WHERE u.papel = com.api.ero_api.usuario.enums.Papel.ADMIN
              AND u.ativo = true
            """)
    long contarAdminsAtivos();

    /**
     * Nomes de vários usuários numa consulta só (trilha de auditoria). Respeita o
     * tenant: dentro de um contratante, quem é de fora (inclusive o superadmin) não aparece.
     */
    @Query("""
            SELECT new com.api.ero_api.usuario.dtos.UsuarioSelectDto(u.id, u.nome)
            FROM Usuario u
            WHERE u.id IN :ids
            """)
    List<UsuarioSelectDto> buscarNomesPorIds(@Param("ids") Collection<UUID> ids);

    @Query("""
            SELECT COUNT(u) > 0 FROM Usuario u
            WHERE u.papel = com.api.ero_api.usuario.enums.Papel.SUPERADMIN
            """)
    boolean existeSuperadmin();

    /**
     * Usuários ativos do contratante atual (filtro automático de tenant), para o
     * limite de usuários. O superadmin nunca conta.
     */
    @Query("""
            SELECT COUNT(u) FROM Usuario u
            WHERE u.ativo = true
              AND u.papel <> com.api.ero_api.usuario.enums.Papel.SUPERADMIN
            """)
    long contarAtivos();

    /**
     * Usuários ativos de vários contratantes numa consulta só (tela de contratantes
     * do superadmin, visão de plataforma). Linhas {@code [tenantId, quantidade]}.
     * Continua JPQL: fora do contexto ROOT o filtro automático só deixa contar o
     * próprio contratante.
     */
    @Query("""
            SELECT u.tenantId, COUNT(u) FROM Usuario u
            WHERE u.tenantId IN :tenantIds
              AND u.ativo = true
              AND u.papel <> com.api.ero_api.usuario.enums.Papel.SUPERADMIN
            GROUP BY u.tenantId
            """)
    List<Object[]> contarAtivosPorTenant(@Param("tenantIds") Collection<UUID> tenantIds);

    // ------------------------------------------------------------ login (contexto ROOT)

    /**
     * Login: trava a linha (SELECT ... FOR UPDATE) para que tentativas em paralelo
     * na mesma conta sejam contadas uma a uma.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT u FROM Usuario u
            WHERE u.email = :email
            """)
    Optional<Usuario> buscarPorEmailComBloqueio(@Param("email") String email);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT u FROM Usuario u
            WHERE u.id = :id
            """)
    Optional<Usuario> buscarPorIdComBloqueio(@Param("id") UUID id);

    /** Contadores de acesso: UPDATE direto, sem mexer em version/auditoria do cadastro. */
    @Modifying
    @Query("""
            UPDATE Usuario u
            SET u.tentativasFalhas = :tentativas, u.bloqueadoAte = :bloqueadoAte
            WHERE u.id = :id
            """)
    int atualizarTentativas(@Param("id") UUID id, @Param("tentativas") int tentativas,
                            @Param("bloqueadoAte") Instant bloqueadoAte);

    @Modifying
    @Query("""
            UPDATE Usuario u
            SET u.tentativasFalhas = 0, u.bloqueadoAte = NULL, u.ultimoLoginEm = :agora
            WHERE u.id = :id
            """)
    int registrarLogin(@Param("id") UUID id, @Param("agora") Instant agora);

    @Modifying
    @Query("""
            UPDATE Usuario u
            SET u.senhaHash = :hash
            WHERE u.id = :id
            """)
    int regravarHashSenha(@Param("id") UUID id, @Param("hash") String hash);

    // ------------------------------------------------------------ preferência pessoal (AuthService, contexto ROOT)

    /** {@code null} quando o usuário segue o tema padrão do contratante. */
    @Query("""
            SELECT u.temaPreferido FROM Usuario u
            WHERE u.id = :id
            """)
    TemaInterface buscarTemaPreferido(@Param("id") UUID id);

    /**
     * Preferência pessoal: UPDATE direto, sem mexer em version/auditoria do cadastro.
     * A troca de tema nunca gera 409 nem atrapalha quem está editando o usuário.
     */
    @Modifying
    @Query("""
            UPDATE Usuario u
            SET u.temaPreferido = :tema
            WHERE u.id = :id
            """)
    int definirTemaPreferido(@Param("id") UUID id, @Param("tema") TemaInterface tema);

    /**
     * Registra que algo do usuário mudou fora da tabela dele (ex.: permissões):
     * confere a versão e incrementa num comando só. 0 linhas = outra pessoa alterou antes.
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            UPDATE VERSIONED Usuario u
            SET u.updatedAt = :agora, u.updatedBy = :autor
            WHERE u.id = :id AND u.version = :versao
            """)
    int marcarAlteracao(@Param("id") UUID id, @Param("versao") Long versao,
                        @Param("agora") Instant agora, @Param("autor") UUID autor);

    /** Nativo de propósito: precisa enxergar o e-mail em qualquer tenant. */
    @Query(value = """
            SELECT EXISTS (
                SELECT 1 FROM usuario
                WHERE email = :email AND id <> :ignorarId
            )
            """, nativeQuery = true)
    boolean emailEmUsoNoSistema(@Param("email") String email, @Param("ignorarId") UUID ignorarId);
}
