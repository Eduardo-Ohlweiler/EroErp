package com.api.ero_api.sessao.entity;

import com.api.ero_api.compartilhado.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Um refresh token de uma sessão. Guardamos só o SHA-256: quem lê o banco não
 * consegue usar o token. Cada token vale UMA vez; reutilizar um token já usado
 * indica roubo e derruba a sessão inteira.
 */
@Entity
@Table(name = "refresh_token")
@Getter
@Setter
@NoArgsConstructor
public class RefreshToken extends BaseEntity {

    @Column(name = "sessao_id", nullable = false, updatable = false)
    private UUID sessaoId;

    @Column(name = "token_hash", nullable = false, length = 64, updatable = false)
    private String tokenHash;

    @Column(name = "expira_em", nullable = false)
    private Instant expiraEm;

    @Column(name = "usado_em")
    private Instant usadoEm;
}
