package com.api.ero_erp.loginlog.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.usuario.entity.Usuario;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "login_log")
@Getter
@Setter
@NoArgsConstructor
public class LoginLog extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "data_login", nullable = false)
    private LocalDateTime dataLogin;

    @Column(name = "data_logout")
    private LocalDateTime dataLogout;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_logout", length = 20)
    private TipoLogout tipoLogout;

    @Column(name = "endereco_ip", length = 45)
    private String enderecoIp;
}
