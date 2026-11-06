package com.api.ero_api.auth.entity;

import com.api.ero_api.compartilhado.entity.TenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Código de uso único para entrar quando o celular do 2FA não está à mão.
 * Guardamos só o SHA-256; o usuário vê os códigos uma única vez.
 */
@Entity
@Table(name = "codigo_recuperacao")
@Getter
@Setter
@NoArgsConstructor
public class CodigoRecuperacao extends TenantEntity {

    @Column(name = "usuario_id", nullable = false, updatable = false)
    private UUID usuarioId;

    @Column(name = "codigo_hash", nullable = false, length = 64, updatable = false)
    private String codigoHash;

    @Column(name = "usado_em")
    private Instant usadoEm;
}
