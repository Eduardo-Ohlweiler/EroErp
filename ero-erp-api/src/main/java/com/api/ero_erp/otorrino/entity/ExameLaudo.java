package com.api.ero_erp.otorrino.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.clinica.entity.Consulta;
import com.api.ero_erp.otorrino.enums.TipoExameLaudo;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.usuario.entity.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "exame_laudo")
@Getter
@Setter
@NoArgsConstructor
public class ExameLaudo extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pessoa_id", nullable = false)
    private Pessoa pessoa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consulta_id")
    private Consulta consulta;

    @Column(name = "data_exame", nullable = false)
    private LocalDate dataExame;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_exame", nullable = false, length = 30)
    private TipoExameLaudo tipoExame;

    @Column(name = "laudo", columnDefinition = "TEXT")
    private String laudo;

    @Column(name = "conclusao", columnDefinition = "TEXT")
    private String conclusao;

    @Column(name = "cid", length = 10)
    private String cid;

    @PrePersist
    public void prePersist() {
        super.prePersist();
    }
}
