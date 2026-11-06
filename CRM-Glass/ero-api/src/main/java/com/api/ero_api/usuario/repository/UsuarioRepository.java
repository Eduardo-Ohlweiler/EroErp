package com.api.ero_api.usuario.repository;

import com.api.ero_api.compartilhado.entity.SqlNativoRevisado;
import com.api.ero_api.usuario.entity.Usuario;
import jakarta.persistence.LockModeType;
import java.time.Instant;
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

    @Query("""
            SELECT u FROM Usuario u
            WHERE u.papel <> com.api.ero_api.usuario.enums.Papel.SUPERADMIN
              AND (:ativo IS NULL OR u.ativo = :ativo)
              AND (:busca IS NULL
                   OR LOWER(u.nome) LIKE LOWER(CONCAT('%', CAST(:busca AS string), '%'))
                   OR LOWER(u.email) LIKE LOWER(CONCAT('%', CAST(:busca AS string), '%')))
            """)
    Page<Usuario> buscarComFiltros(@Param("busca") String busca, @Param("ativo") Boolean ativo, Pageable pageable);

    @Query("""
            SELECT u FROM Usuario u
            WHERE u.ativo = true
              AND u.papel <> com.api.ero_api.usuario.enums.Papel.SUPERADMIN
            ORDER BY u.nome
            """)
    List<Usuario> buscarParaSelecao();

    @Query("""
            SELECT COUNT(u) > 0 FROM Usuario u
            WHERE u.papel = com.api.ero_api.usuario.enums.Papel.SUPERADMIN
            """)
    boolean existeSuperadmin();

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

    @Modifying
    @Query("""
            UPDATE Usuario u
            SET u.totpUltimoPasso = :passo
            WHERE u.id = :id
            """)
    int registrarPassoTotp(@Param("id") UUID id, @Param("passo") long passo);

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
