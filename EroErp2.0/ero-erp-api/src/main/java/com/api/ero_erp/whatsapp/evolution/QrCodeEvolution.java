package com.api.ero_erp.whatsapp.evolution;

/**
 * O que o {@code connect} devolve. Os dois nulos quando a instância já está
 * conectada: a Evolution responde o estado, e não um QR.
 *
 * @param base64      a imagem do QR, como a Evolution manda (em geral já com
 *                    o prefixo {@code data:image/png;base64,})
 * @param pairingCode o código de pareamento, para digitar no celular
 */
public record QrCodeEvolution(String base64, String pairingCode) {

    public boolean jaConectada() {
        return base64 == null && pairingCode == null;
    }
}
