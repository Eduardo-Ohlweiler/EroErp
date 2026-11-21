package com.api.ero_api.servico.repository;

import com.api.ero_api.servico.entity.ServicoFilial;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Filiais do serviço. O filtro de tenant é automático em todo JPQL. */
public interface ServicoFilialRepository extends JpaRepository<ServicoFilial, UUID> {

    /** As filiais de um serviço, com a pessoa de cada filial (o nome), por código da filial. */
    @Query("""
            SELECT sf FROM ServicoFilial sf
            JOIN FETCH sf.filial f
            JOIN FETCH f.pessoa
            WHERE sf.servico.id = :servicoId
            ORDER BY f.codFilial
            """)
    List<ServicoFilial> buscarPorServico(@Param("servicoId") UUID servicoId);

    /** As filiais dos serviços de uma página da lista, numa consulta só. */
    @Query("""
            SELECT sf FROM ServicoFilial sf
            JOIN FETCH sf.filial f
            JOIN FETCH f.pessoa
            WHERE sf.servico.id IN :servicoIds
            ORDER BY f.codFilial
            """)
    List<ServicoFilial> buscarPorServicos(@Param("servicoIds") Collection<UUID> servicoIds);

    /** A lista do salvar substitui a anterior: apaga tudo do serviço antes de gravar a nova. */
    @Modifying(flushAutomatically = true)
    @Query("""
            DELETE FROM ServicoFilial sf
            WHERE sf.servico.id = :servicoId
            """)
    int removerPorServico(@Param("servicoId") UUID servicoId);
}
