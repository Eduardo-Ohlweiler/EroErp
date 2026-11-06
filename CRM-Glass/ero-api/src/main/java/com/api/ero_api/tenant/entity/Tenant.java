package com.api.ero_api.tenant.entity;

import com.api.ero_api.compartilhado.entity.BaseEntity;
import com.api.ero_api.tenant.enums.Fundo;
import com.api.ero_api.tenant.enums.NivelAnimacao;
import com.api.ero_api.tenant.enums.TemaInterface;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Contratante (cliente da plataforma). É a raiz do multi-tenant, então NÃO é
 * TenantEntity. Só o superadmin cria e altera.
 *
 * <p>O registro com id {@code 00000000-0000-0000-0000-000000000000} é a
 * "Plataforma", dona do superadmin, criada pela migration 001.
 *
 * <p>A aparência (tema, destaque, fundo, vidro, foco, animações) é do contratante e
 * vale para todos os usuários dele: não existe preferência por usuário. Os valores
 * iniciais abaixo são o padrão do sistema, iguais aos da migration 008.
 */
@Entity
@Table(name = "tenant")
@Getter
@Setter
@NoArgsConstructor
public class Tenant extends BaseEntity {

    @Column(name = "nome", nullable = false, length = 150)
    private String nome;

    /** CNPJ ou CPF, só dígitos. */
    @Column(name = "documento", length = 14)
    private String documento;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "ativo", nullable = false)
    private boolean ativo = true;

    /** Obriga todos os usuários a configurar a verificação em duas etapas. */
    @Column(name = "exige_2fa", nullable = false)
    private boolean exige2fa;

    /** Cor de destaque da interface (ver tokens do front). */
    @Column(name = "cor_destaque", nullable = false, length = 20)
    private String corDestaque = "violeta";

    @Enumerated(EnumType.STRING)
    @Column(name = "tema_padrao", nullable = false, length = 10)
    private TemaInterface temaPadrao = TemaInterface.ESCURO;

    @Enumerated(EnumType.STRING)
    @Column(name = "fundo", nullable = false, length = 40)
    private Fundo fundo = Fundo.ORBS;

    @Column(name = "fundo_animado", nullable = false)
    private boolean fundoAnimado = true;

    /** Desfoque do vidro, em px (0 a 40). */
    @Column(name = "vidro_desfoque", nullable = false)
    private int vidroDesfoque = 12;

    /** Desfoque da foto nos fundos de cena, em px (0 a 10, passo 0,5). */
    @Column(name = "fundo_foco", nullable = false, precision = 3, scale = 1)
    private BigDecimal fundoFoco = new BigDecimal("3.0");

    @Enumerated(EnumType.STRING)
    @Column(name = "animacoes", nullable = false, length = 10)
    private NivelAnimacao animacoes = NivelAnimacao.COMPLETAS;

    /** Cena exclusiva vinculada a este contratante (cada cena tem no máximo um dono). */
    @Enumerated(EnumType.STRING)
    @Column(name = "fundo_exclusivo", length = 40)
    private Fundo fundoExclusivo;
}
