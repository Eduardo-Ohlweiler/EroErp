package com.api.ero_erp.compromisso.entity;

import com.api.ero_erp.baseentity.TenantEntity;
import com.api.ero_erp.usuario.entity.Usuario;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Outro usuário que participa do compromisso, além do responsável. */
@Entity
@Table(name = "compromisso_convidado")
@Getter
@Setter
@NoArgsConstructor
public class CompromissoConvidado extends TenantEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "compromisso_id", nullable = false, updatable = false)
    private Compromisso compromisso;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false, updatable = false)
    private Usuario usuario;
}
