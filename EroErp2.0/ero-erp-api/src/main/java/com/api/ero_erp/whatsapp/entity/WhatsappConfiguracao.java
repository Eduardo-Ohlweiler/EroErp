package com.api.ero_erp.whatsapp.entity;

import com.api.ero_erp.baseentity.TenantEntity;
import com.api.ero_erp.whatsapp.enums.ModoWhatsapp;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** O modo do tenant. Sem linha, vale {@link ModoWhatsapp#TENANT}. */
@Entity
@Table(name = "whatsapp_configuracao")
@Getter
@Setter
@NoArgsConstructor
public class WhatsappConfiguracao extends TenantEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "modo", nullable = false, length = 20)
    private ModoWhatsapp modo = ModoWhatsapp.TENANT;
}
