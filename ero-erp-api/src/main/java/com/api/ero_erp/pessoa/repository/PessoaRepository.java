package com.api.ero_erp.pessoa.repository;

import com.api.ero_erp.pessoa.dtos.PessoaBuscaDto;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.pessoa.enums.TipoPessoa;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PessoaRepository extends JpaRepository<Pessoa, Long> {

//    @EntityGraph(attributePaths = {
//            "emails",
//            "tiposCadastro"
//    })
    Optional<Pessoa> findByIdAndClienteId(Long id, Long clienteId);

    // ─── Unicidade (create) ────────────────────────────────────────────────────
    boolean existsByCpfAndClienteId(String cpf, Long clienteId);
    boolean existsByRgAndClienteId(String rg, Long clienteId);
    boolean existsByCnpjAndClienteId(String cnpj, Long clienteId);
    boolean existsByInscricaoEstadualAndClienteId(String ie, Long clienteId);
    boolean existsByInscricaoMunicipalAndClienteId(String im, Long clienteId);
    boolean existsByCnhAndClienteId(String cnh, Long clienteId);

    // ─── Unicidade (update) ────────────────────────────────────────────────────
    boolean existsByCpfAndClienteIdAndIdNot(String cpf, Long clienteId, Long id);
    boolean existsByRgAndClienteIdAndIdNot(String rg, Long clienteId, Long id);
    boolean existsByCnpjAndClienteIdAndIdNot(String cnpj, Long clienteId, Long id);
    boolean existsByInscricaoEstadualAndClienteIdAndIdNot(String ie, Long clienteId, Long id);
    boolean existsByInscricaoMunicipalAndClienteIdAndIdNot(String im, Long clienteId, Long id);
    boolean existsByCnhAndClienteIdAndIdNot(String cnh, Long clienteId, Long id);

    // ─── GetAll com filtros ────────────────────────────────────────────────────
    @Query("""
        SELECT DISTINCT p FROM Pessoa p
            LEFT JOIN p.tiposCadastro tc
        WHERE p.cliente.id = :clienteId
            AND (:nome       IS NULL OR LOWER(p.nome)  LIKE LOWER(CONCAT('%', CAST(:nome  AS string), '%')))
            AND (:cpf        IS NULL OR p.cpf           LIKE CONCAT('%', CAST(:cpf   AS string), '%'))
            AND (:rg         IS NULL OR p.rg            LIKE CONCAT('%', CAST(:rg    AS string), '%'))
            AND (:cnh        IS NULL OR p.cnh           LIKE CONCAT('%', CAST(:cnh   AS string), '%'))
            AND (:cnpj       IS NULL OR p.cnpj          LIKE CONCAT('%', CAST(:cnpj  AS string), '%'))
            AND (:ativo      IS NULL OR p.ativo          = :ativo)
            AND (:tipoPessoa IS NULL OR p.tipoPessoa     = :tipoPessoa)
            AND (:tipoCadastroId IS NULL OR tc.id        = :tipoCadastroId)
    """)
    Page<Pessoa> findAllWithFilters(
            Pageable pageable,
            @Param("clienteId")     Long       clienteId,
            @Param("nome")          String     nome,
            @Param("cpf")           String     cpf,
            @Param("rg")            String     rg,
            @Param("cnh")           String     cnh,
            @Param("cnpj")          String     cnpj,
            @Param("ativo")         Boolean    ativo,
            @Param("tipoPessoa")    TipoPessoa tipoPessoa,
            @Param("tipoCadastroId") Long      tipoCadastroId
    );

    // ─── Select para combos ────────────────────────────────────────────────────
    @Query("""
        SELECT p FROM Pessoa p
        WHERE p.cliente.id = :clienteId
            AND p.ativo = true
            AND (:ignorarId IS NULL OR p.id <> :ignorarId)
            AND (:nome IS NULL
                 OR LOWER(p.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%'))
                 OR p.cpf  LIKE CONCAT('%', CAST(:nome AS string), '%')
                 OR p.cnpj LIKE CONCAT('%', CAST(:nome AS string), '%'))
        ORDER BY p.nome
    """)
    List<Pessoa> findForSelect(
            @Param("clienteId") Long   clienteId,
            @Param("nome")      String nome,
            @Param("ignorarId") Long   ignorarId
    );

    // ─── Busca paginada para vínculo (nome / documento / telefone) ─────────────
    @Query(value = """
        SELECT new com.api.ero_erp.pessoa.dtos.PessoaBuscaDto(
            p.id, p.nome, p.tipoPessoa, p.cpf, p.cnpj,
            (SELECT MIN(t.numero) FROM Telefone t WHERE t.pessoa = p))
        FROM Pessoa p
        WHERE p.cliente.id = :clienteId
          AND p.ativo = true
          AND (:nome IS NULL OR LOWER(p.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
          AND (:documento IS NULL
               OR p.cpf  LIKE CONCAT('%', CAST(:documento AS string), '%')
               OR p.cnpj LIKE CONCAT('%', CAST(:documento AS string), '%'))
          AND (:telefone IS NULL
               OR EXISTS (SELECT 1 FROM Telefone t2 WHERE t2.pessoa = p
                          AND t2.numero LIKE CONCAT('%', CAST(:telefone AS string), '%')))
        ORDER BY p.nome
        """,
        countQuery = """
        SELECT COUNT(p) FROM Pessoa p
        WHERE p.cliente.id = :clienteId
          AND p.ativo = true
          AND (:nome IS NULL OR LOWER(p.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
          AND (:documento IS NULL
               OR p.cpf  LIKE CONCAT('%', CAST(:documento AS string), '%')
               OR p.cnpj LIKE CONCAT('%', CAST(:documento AS string), '%'))
          AND (:telefone IS NULL
               OR EXISTS (SELECT 1 FROM Telefone t2 WHERE t2.pessoa = p
                          AND t2.numero LIKE CONCAT('%', CAST(:telefone AS string), '%')))
        """)
    Page<PessoaBuscaDto> buscarParaVinculo(
            @Param("clienteId") Long   clienteId,
            @Param("nome")      String nome,
            @Param("documento") String documento,
            @Param("telefone")  String telefone,
            Pageable pageable
    );
}