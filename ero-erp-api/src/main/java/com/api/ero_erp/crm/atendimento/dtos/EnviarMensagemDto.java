package com.api.ero_erp.crm.atendimento.dtos;

/**
 * Envio de mensagem pelo atendente.
 * - tipo TEXTO: usa apenas 'conteudo'.
 * - tipo IMAGEM/VIDEO/DOCUMENTO: usa 'base64' (+ mimetype/fileName/conteudo como caption).
 * - tipo AUDIO: usa 'base64'.
 */
public record EnviarMensagemDto(
        String tipo,       // TEXTO, IMAGEM, AUDIO, VIDEO, DOCUMENTO
        String conteudo,   // texto ou caption
        String base64,     // conteúdo binário em base64 (mídia/áudio)
        String mimetype,
        String fileName
) {}
