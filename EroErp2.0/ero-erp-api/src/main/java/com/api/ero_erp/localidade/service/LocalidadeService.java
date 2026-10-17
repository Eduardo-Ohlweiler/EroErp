package com.api.ero_erp.localidade.service;

import com.api.ero_erp.catalogo.dtos.CatalogoSelectDto;
import com.api.ero_erp.exceptions.BadRequestException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.localidade.cep.ConsultaCep;
import com.api.ero_erp.localidade.cep.EnderecoDoCep;
import com.api.ero_erp.localidade.dtos.CepResponseDto;
import com.api.ero_erp.localidade.dtos.CidadeSelectDto;import com.api.ero_erp.localidade.entity.Cidade;
import com.api.ero_erp.localidade.repository.CidadeRepository;
import com.api.ero_erp.localidade.repository.EstadoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Leitura de estados e municípios do IBGE. Somente leitura: os dados vêm do
 * seed da migration {@code 011-estado-cidade-ibge.xml} e não há tela de
 * manutenção — município não é cadastro do cliente.
 */
@Service
@RequiredArgsConstructor
public class LocalidadeService {

    private final EstadoRepository estadoRepository;
    private final CidadeRepository cidadeRepository;
    private final ConsultaCep consultaCep;

    @Transactional(readOnly = true)
    public List<CatalogoSelectDto> estados() {
        return estadoRepository.findAllByAtivoTrueOrderByNome().stream()
                .map(e -> new CatalogoSelectDto(e.getId(), e.getSigla() + " — " + e.getNome()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CidadeSelectDto> cidades(String nome, UUID estadoId) {
        return cidadeRepository.findForSelect(nomeOuNulo(nome), estadoId).stream()
                .map(c -> new CidadeSelectDto(c.getId(), c.getNome(), c.getEstado().getSigla()))
                .toList();
    }

    @Transactional(readOnly = true)
    public Cidade exigirCidade(UUID id) {
        return cidadeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Cidade não encontrada"));
    }

    /**
     * Endereço pelo CEP, com a cidade já na tabela IBGE. Só leitura: quem
     * grava é o cadastro, com o que o usuário confirmou na tela.
     *
     * <p>A cidade é achada pelo código IBGE que o provedor devolve. Se o
     * município não estiver na tabela, rua e bairro voltam assim mesmo, sem
     * cidade e com o motivo — o usuário escolhe a cidade no combo.
     */
    @Transactional(readOnly = true)
    public CepResponseDto consultarCep(String cep) {
        String digitos = cep == null ? "" : cep.replaceAll("\\D", "");
        if (digitos.length() != 8) {
            throw new BadRequestException("CEP deve ter 8 dígitos");
        }

        EnderecoDoCep achado = consultaCep.consultar(digitos)
                .orElseThrow(() -> new NotFoundException("CEP não encontrado"));

        boolean cepUnico = achado.logradouro().isEmpty() && achado.bairro().isEmpty();
        Cidade cidade = achado.codigoIbge() == null ? null
                : cidadeRepository.findByCodigoIbge(achado.codigoIbge()).orElse(null);

        return new CepResponseDto(
                digitos,
                achado.logradouro(),
                achado.bairro(),
                cidade != null ? cidade.getId() : null,
                cidade != null ? cidade.getNome() : null,
                cidade != null ? cidade.getEstado().getSigla() : achado.uf(),
                cepUnico,
                cidade == null ? "Cidade deste CEP não encontrada na tabela do IBGE. Escolha no campo Cidade" : null);
    }

    private String nomeOuNulo(String valor) {
        return (valor == null || valor.isBlank()) ? null : valor.trim();
    }
}
