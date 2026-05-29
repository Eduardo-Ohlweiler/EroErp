package com.api.ero_erp.whatsapp.whatsappconfigglobal.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "whatsapp_config_global")
@Getter
@Setter
@NoArgsConstructor
public class WhatsappConfigGlobal extends BaseEntity {

    @Column(name = "api_url", length = 255)
    private String apiUrl;

    @Column(name = "api_key", columnDefinition = "TEXT")
    private String apiKey;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo = true;

    @PrePersist
    public void prePersist() {
        super.prePersist();
        if (this.ativo == null) this.ativo = true;
    }
}
