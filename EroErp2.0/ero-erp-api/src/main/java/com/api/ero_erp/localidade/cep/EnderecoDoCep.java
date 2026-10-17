package com.api.ero_erp.localidade.cep;

/**
 * O que o provedor de CEP sabe sobre um CEP. {@code logradouro} e
 * {@code bairro} vêm vazios no CEP único de cidade (Venâncio Aires,
 * 95800-000): ali só a cidade é conhecida.
 *
 * @param codigoIbge município no código do IBGE — é por ele que se acha a
 *                   cidade da tabela, e não pelo nome
 */
public record EnderecoDoCep(
        String cep,
        String logradouro,
        String bairro,
        Integer codigoIbge,
        String uf
) {}
