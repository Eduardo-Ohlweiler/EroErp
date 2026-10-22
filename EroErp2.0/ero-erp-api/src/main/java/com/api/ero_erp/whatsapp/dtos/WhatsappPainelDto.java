package com.api.ero_erp.whatsapp.dtos;

import com.api.ero_erp.whatsapp.enums.ModoWhatsapp;

import java.util.List;

/**
 * A tela de WhatsApp do tenant.
 *
 * @param servidorConfigurado há servidor ativo (ou nenhuma conexão conecta)
 * @param conexoes            no modo TENANT, uma linha; no POR_FILIAL, uma por
 *                            filial ativa, em ordem de nome
 * @param foraDoModo          só para o superadmin: conexões que o modo atual
 *                            não usa (do outro modo, ou de filial inativa),
 *                            para ele excluir. Nulo para os demais
 * @param webhookConfigurado  só para o superadmin: há {@code APP_PUBLIC_URL},
 *                            então a Evolution avisa as mudanças de conexão
 */
public record WhatsappPainelDto(
        ModoWhatsapp modo,
        boolean servidorConfigurado,
        List<ConexaoDto> conexoes,
        List<ConexaoDto> foraDoModo,
        Boolean webhookConfigurado
) {}
