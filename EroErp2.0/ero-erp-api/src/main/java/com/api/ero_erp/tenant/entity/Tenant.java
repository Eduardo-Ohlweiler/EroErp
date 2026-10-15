package com.api.ero_erp.tenant.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.tenant.enums.PaletaSistema;
import com.api.ero_erp.tenant.enums.PeriodoAcesso;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "tenant")
@Getter
@Setter
@NoArgsConstructor
public class Tenant extends BaseEntity {

    @Column(name = "nome", nullable = false, length = 255)
    private String nome;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo = true;

    /** Licença do cliente. Ver {@link PeriodoAcesso}. */
    @Enumerated(EnumType.STRING)
    @Column(name = "periodo_acesso", nullable = false, length = 20)
    private PeriodoAcesso periodoAcesso = PeriodoAcesso.INDETERMINADO;

    @Column(name = "acesso_expira_em")
    private Instant acessoExpiraEm;

    /** Cor do sistema para os usuários deste tenant. Ver {@link PaletaSistema}. */
    @Enumerated(EnumType.STRING)
    @Column(name = "paleta", nullable = false, length = 40)
    private PaletaSistema paleta = PaletaSistema.PADRAO;

    public Tenant(String nome) {
        this.nome = nome;
    }

    /**
     * Prazo vencido, independentemente de a rotina diária já ter passado por
     * aqui — a regra mora na entidade, como {@code Usuario.estaBloqueado()}.
     */
    public boolean acessoExpirado() {
        return acessoExpiraEm != null && acessoExpiraEm.isBefore(Instant.now());
    }
}
