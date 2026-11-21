package com.api.ero_api.pessoa.service;

import com.api.ero_api.pessoa.dtos.PessoaVinculoItemDto;
import com.api.ero_api.pessoa.entity.Pessoa;
import com.api.ero_api.pessoa.entity.PessoaVinculo;
import com.api.ero_api.pessoa.mapper.PessoaMapper;
import com.api.ero_api.pessoa.repository.PessoaVinculoRepository;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Vínculos entre pessoas. Uma linha serve os dois cadastros (orientação canônica no
 * {@link PessoaMapper#vinculo}). Só o {@link PessoaService} chama, já com as duas pontas
 * travadas e as regras validadas: aqui é só gravar a diferença.
 */
@Service
public class PessoaVinculoService {

    private final PessoaVinculoRepository repository;

    public PessoaVinculoService(PessoaVinculoRepository repository) {
        this.repository = repository;
    }

    /** Os vínculos da pessoa, dos dois lados, com as duas pessoas junto. */
    @Transactional(readOnly = true)
    public List<PessoaVinculo> buscarDaPessoa(UUID pessoaId) {
        return repository.buscarPorPessoa(pessoaId);
    }

    /**
     * Grava a lista de vínculos de {@code p} como o estado completo. Casa pela OUTRA pessoa
     * (o par é único): a que saiu é apagada (antes de inserir), a que entrou é inserida e a
     * que mudou de tipo ou observação é atualizada na orientação da linha.
     *
     * @param itens   a lista que chegou (já validada)
     * @param antes   os vínculos atuais de {@code p}, lidos depois da trava
     * @param pessoas as outras pessoas, travadas, por id
     * @return os ids das outras pessoas cujo vínculo mudou (a versão delas sobe)
     */
    @Transactional
    public Set<UUID> sincronizar(Pessoa p, List<PessoaVinculoItemDto> itens, List<PessoaVinculo> antes,
                                 Map<UUID, Pessoa> pessoas) {
        Map<UUID, PessoaVinculo> atuais = new HashMap<>();
        antes.forEach(v -> atuais.put(PessoaMapper.outraPessoa(v, p.getId()).getId(), v));
        Map<UUID, PessoaVinculoItemDto> novos = new HashMap<>();
        itens.forEach(i -> novos.put(i.pessoaId(), i));
        Set<UUID> mudaram = new HashSet<>();

        List<UUID> saiu = new ArrayList<>();
        atuais.forEach((outra, v) -> {
            if (!novos.containsKey(outra)) {
                saiu.add(v.getId());
                mudaram.add(outra);
            }
        });
        if (!saiu.isEmpty()) {
            repository.removerPorIds(saiu);
        }

        List<PessoaVinculo> entrou = new ArrayList<>();
        for (PessoaVinculoItemDto item : itens) {
            PessoaVinculo v = atuais.get(item.pessoaId());
            if (v == null) {
                entrou.add(PessoaMapper.vinculo(p, pessoas.get(item.pessoaId()), item.tipo(), item.observacao()));
                mudaram.add(item.pessoaId());
            } else if (PessoaMapper.tipoNaVisaoDe(v, p.getId()) != item.tipo()
                    || !Objects.equals(v.getObservacao(), PessoaMapper.textoOuNulo(item.observacao()))) {
                PessoaMapper.atualizarVinculo(v, p.getId(), item.tipo(), item.observacao());
                mudaram.add(item.pessoaId());
            }
        }
        repository.saveAll(entrou);
        repository.flush();
        return mudaram;
    }
}
