package com.api.ero_api.localidade.service;

import com.api.ero_api.compartilhado.exception.CampoInvalidoException;
import com.api.ero_api.compartilhado.exception.NaoEncontradoException;
import com.api.ero_api.compartilhado.util.TextoBusca;
import com.api.ero_api.localidade.dtos.CepResponseDto;
import com.api.ero_api.localidade.dtos.CidadeSelectDto;
import com.api.ero_api.localidade.dtos.EstadoSelectDto;
import com.api.ero_api.localidade.dtos.ViaCepRespostaDto;
import com.api.ero_api.localidade.entity.Cidade;
import com.api.ero_api.localidade.entity.Estado;
import com.api.ero_api.localidade.mapper.LocalidadeMapper;
import com.api.ero_api.localidade.repository.CidadeRepository;
import com.api.ero_api.localidade.repository.EstadoRepository;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Estados, cidades (IBGE) e consulta de CEP. Dado de referência, igual para todos os
 * contratantes: não há tenant aqui.
 */
@Service
public class LocalidadeService {

    /** Itens do combo de cidades: o usuário digita mais para achar a que não apareceu. */
    static final int LIMITE_SELECAO = 50;
    private static final Pattern CEP = Pattern.compile("\\d{8}");
    private static final Pattern CODIGO_IBGE = Pattern.compile("\\d{7}");

    private final EstadoRepository estados;
    private final CidadeRepository cidades;
    private final ViaCepService viaCep;

    public LocalidadeService(EstadoRepository estados, CidadeRepository cidades, ViaCepService viaCep) {
        this.estados = estados;
        this.cidades = cidades;
        this.viaCep = viaCep;
    }

    /** As 27 UFs, por sigla (o combo da UF do RG). */
    @Transactional(readOnly = true)
    public List<EstadoSelectDto> listarEstados() {
        return estados.buscarTodos().stream().map(LocalidadeMapper::toEstadoSelectDto).toList();
    }

    /** Para outros services (a UF do RG da pessoa). Id inexistente = vazio. */
    @Transactional(readOnly = true)
    public Optional<Estado> buscarEstado(UUID id) {
        return estados.buscarPorId(id);
    }

    /** {@code busca} sem acento e sem caixa ("sao paulo" acha "São Paulo"); {@code uf} vazia = todas. */
    @Transactional(readOnly = true)
    public List<CidadeSelectDto> buscarCidadesParaSelecao(String busca, String uf) {
        String sigla = uf == null || uf.isBlank() ? null : uf;
        return cidades.buscarParaSelecao(TextoBusca.normalizar(busca), sigla, PageRequest.of(0, LIMITE_SELECAO))
                .stream().map(LocalidadeMapper::toSelectDto).toList();
    }

    /**
     * Para outros services (endereços da pessoa): várias cidades numa consulta só, já com
     * o estado. Id inexistente fica fora do mapa.
     */
    @Transactional(readOnly = true)
    public Map<UUID, Cidade> buscarCidades(Collection<UUID> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        return cidades.buscarPorIds(ids).stream().collect(Collectors.toMap(Cidade::getId, Function.identity()));
    }

    /**
     * Endereço do CEP pelo ViaCEP. Sem {@code @Transactional} de propósito: a chamada
     * externa pode levar até 3 s e não deve segurar uma conexão do banco; a cidade é
     * lida depois, numa consulta só (com o estado junto).
     */
    public CepResponseDto consultarCep(String cep) {
        if (cep == null || !CEP.matcher(cep).matches()) {
            throw new CampoInvalidoException("cep", "CEP deve ter 8 dígitos.");
        }
        ViaCepRespostaDto via = viaCep.consultar(cep)
                .orElseThrow(() -> new NaoEncontradoException("CEP não encontrado."));
        Cidade cidade = via.ibge() != null && CODIGO_IBGE.matcher(via.ibge()).matches()
                ? cidades.buscarPorCodigoIbge(Integer.valueOf(via.ibge())).orElse(null)
                : null;
        return LocalidadeMapper.toCepResponseDto(cep, cidade, via);
    }
}
