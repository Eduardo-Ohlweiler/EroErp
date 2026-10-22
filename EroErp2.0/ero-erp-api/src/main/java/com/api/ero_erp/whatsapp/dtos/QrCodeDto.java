package com.api.ero_erp.whatsapp.dtos;

/**
 * A resposta de conectar.
 *
 * @param base64      a imagem do QR; nula quando a conexão já estava conectada
 * @param pairingCode o código para digitar no celular, quando a Evolution manda
 */
public record QrCodeDto(
        ConexaoDto conexao,
        String base64,
        String pairingCode
) {}
