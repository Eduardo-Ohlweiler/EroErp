package com.api.ero_erp.assinatura.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.documento.entity.Documento;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "assinatura_documento")
@Getter @Setter @NoArgsConstructor
public class AssinaturaDocumento extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "documento_id", nullable = false)
    private Documento documento;

    @Column(name = "token", length = 100, nullable = false, unique = true)
    private String token;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private AssinaturaStatus status;

    @Column(name = "dados_assinatura", columnDefinition = "TEXT")
    private String dadosAssinatura;

    @Column(name = "ip_assinante", length = 45)
    private String ipAssinante;

    @Column(name = "data_assinatura")
    private LocalDateTime dataAssinatura;
}
