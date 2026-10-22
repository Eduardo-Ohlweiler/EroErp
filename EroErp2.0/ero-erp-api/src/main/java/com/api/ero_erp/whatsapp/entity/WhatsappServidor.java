package com.api.ero_erp.whatsapp.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.config.CriptoConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * O servidor Evolution do sistema. Global e de linha única — o índice
 * {@code uk_whatsapp_servidor_unico} garante. Só o superadmin o vê.
 */
@Entity
@Table(name = "whatsapp_servidor")
@Getter
@Setter
@NoArgsConstructor
public class WhatsappServidor extends BaseEntity {

    @Column(name = "url", nullable = false, length = 255)
    private String url;

    /** Criptografada na coluna; nunca sai pela API. */
    @Convert(converter = CriptoConverter.class)
    @Column(name = "api_key", nullable = false)
    private String apiKey;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo = true;
}
