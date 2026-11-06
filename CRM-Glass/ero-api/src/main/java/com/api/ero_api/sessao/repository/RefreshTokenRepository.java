package com.api.ero_api.sessao.repository;

import com.api.ero_api.sessao.entity.RefreshToken;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    @Query("""
            SELECT r FROM RefreshToken r
            WHERE r.tokenHash = :hash
            """)
    Optional<RefreshToken> buscarPorHash(@Param("hash") String hash);
}
