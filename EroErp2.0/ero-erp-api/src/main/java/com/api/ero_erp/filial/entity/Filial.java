package com.api.ero_erp.filial.entity;

import com.api.ero_erp.baseentity.TenantEntity;
import com.api.ero_erp.filial.enums.TipoFilial;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.usuario.entity.Usuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Filial do tenant — o "emitente" do EroErp antigo.
 *
 * <p>Não duplica cadastro: CNPJ, inscrições, razão social e endereço são da
 * {@link Pessoa}. Aqui fica o papel (matriz ou filial), a matriz a que a
 * filial responde e a cor que a identifica nas telas. Ver docs/09.
 */
@Entity
@Table(name = "filial")
@Getter
@Setter
@NoArgsConstructor
public class Filial extends TenantEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pessoa_id", nullable = false)
    private Pessoa pessoa;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 20)
    private TipoFilial tipo;

    /** Só na {@code FILIAL}; a matriz não responde a ninguém. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "matriz_id")
    private Filial matriz;

    @Column(name = "cor", nullable = false, length = 7)
    private String cor;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private Usuario createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private Usuario updatedBy;

    public boolean ehMatriz() {
        return TipoFilial.MATRIZ.equals(this.tipo);
    }
}
