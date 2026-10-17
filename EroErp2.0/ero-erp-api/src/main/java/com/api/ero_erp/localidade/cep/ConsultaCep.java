package com.api.ero_erp.localidade.cep;

import java.util.Optional;

/**
 * Consulta de CEP num provedor externo. Interface para que trocar de provedor
 * seja trocar uma classe, e para que os testes não dependam de rede.
 */
public interface ConsultaCep {

    /**
     * @param cep oito dígitos, sem máscara
     * @return vazio quando o CEP não existe
     * @throws com.api.ero_erp.exceptions.ServicoIndisponivelException se o
     *         provedor não respondeu
     */
    Optional<EnderecoDoCep> consultar(String cep);
}
