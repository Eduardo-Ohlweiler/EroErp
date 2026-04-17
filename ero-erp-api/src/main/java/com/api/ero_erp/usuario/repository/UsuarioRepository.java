package com.api.ero_erp.usuario.repository;

import com.api.ero_erp.usuario.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    boolean existsByEmailIgnoreCase(String email);

    @Query("SELECT u FROM Usuario u LEFT JOIN FETCH u.roles WHERE LOWER(u.email) = LOWER(:email)")
    Optional<Usuario> findByEmailIgnoreCase(String email);

    @Query("SELECT COUNT(u) > 0 FROM Usuario u JOIN u.roles r WHERE r.nome = 'SUPERADMIN'")
    boolean existsBySuperAdmin();
}