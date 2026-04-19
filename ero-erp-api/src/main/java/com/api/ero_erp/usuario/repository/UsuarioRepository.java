package com.api.ero_erp.usuario.repository;

import com.api.ero_erp.usuario.entity.Usuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    boolean existsByEmailIgnoreCase(String email);

    @Query("SELECT u FROM Usuario u LEFT JOIN FETCH u.roles WHERE LOWER(u.email) = LOWER(:email)")
    Optional<Usuario> findByEmailIgnoreCase(String email);

    @Query("SELECT COUNT(u) > 0 FROM Usuario u JOIN u.roles r WHERE r.nome = 'SUPERADMIN'")
    boolean existsBySuperAdmin();

    @Query("""
        SELECT u FROM Usuario u
            LEFT JOIN FETCH u.roles
                WHERE (:clienteId IS NULL OR u.cliente.id = :clienteId)
                    AND   (:nome  IS NULL OR LOWER(u.nome)  LIKE LOWER(CONCAT('%', CAST(:nome  AS string), '%')))
                    AND   (:email IS NULL OR LOWER(u.email) LIKE LOWER(CONCAT('%', CAST(:email AS string), '%')))
    """)
    Page<Usuario> findAllWithFilters(
            Pageable pageable,
            @Param("clienteId") Long   clienteId,
            @Param("nome")      String nome,
            @Param("email")     String email
    );

    @Query("""
    SELECT u FROM Usuario u LEFT JOIN FETCH u.roles
        WHERE u.ativo = true
            AND (:clienteId IS NULL OR u.cliente.id = :clienteId)
            AND (:nome IS NULL OR LOWER(u.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
    ORDER BY u.nome
    """)
    List<Usuario> findForSelect(
            @Param("clienteId") Long   clienteId,
            @Param("nome")      String nome
    );
}