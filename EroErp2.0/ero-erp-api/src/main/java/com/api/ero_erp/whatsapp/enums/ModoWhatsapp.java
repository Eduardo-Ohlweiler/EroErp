package com.api.ero_erp.whatsapp.enums;

/**
 * De quem é o número de WhatsApp do tenant. Só o superadmin escolhe.
 *
 * <p>Trocar de modo não apaga conexão: a do outro modo fica de lado (o
 * superadmin a vê e a exclui), e quem envia passa a usar a do modo novo.
 */
public enum ModoWhatsapp {
    /** Um número para o tenant inteiro. O padrão, quando nada foi escolhido. */
    TENANT,
    /** Um número por filial. */
    POR_FILIAL
}
