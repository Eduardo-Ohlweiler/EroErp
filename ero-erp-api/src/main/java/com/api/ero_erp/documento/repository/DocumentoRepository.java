package com.api.ero_erp.documento.repository;

import com.api.ero_erp.documento.entity.Documento;
import com.api.ero_erp.documento.entity.DocumentoStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface DocumentoRepository extends JpaRepository<Documento, Long> {

    @Query("""
        SELECT d FROM Documento d
        JOIN FETCH d.cliente
        JOIN FETCH d.modeloDocumento
        JOIN FETCH d.emitente em JOIN FETCH em.pessoa
        JOIN FETCH d.clientePessoa
        LEFT JOIN FETCH d.estoque est LEFT JOIN FETCH est.produto
        LEFT JOIN FETCH d.formaPagamento
        LEFT JOIN FETCH d.createdBy
        LEFT JOIN FETCH d.updatedBy
        WHERE d.id = :id AND d.cliente.id = :clienteId
    """)
    Optional<Documento> findByIdAndClienteId(
            @Param("id")        Long id,
            @Param("clienteId") Long clienteId
    );

    @Query("""
        SELECT d FROM Documento d
        JOIN FETCH d.cliente
        JOIN FETCH d.modeloDocumento
        JOIN FETCH d.emitente em JOIN FETCH em.pessoa
        JOIN FETCH d.clientePessoa
        LEFT JOIN FETCH d.estoque est LEFT JOIN FETCH est.produto
        LEFT JOIN FETCH d.formaPagamento
        LEFT JOIN FETCH d.createdBy
        LEFT JOIN FETCH d.updatedBy
        WHERE d.cliente.id = :clienteId
          AND (:emitenteId IS NULL OR d.emitente.id = :emitenteId)
          AND (:clientePessoaNome IS NULL OR LOWER(d.clientePessoa.nome) LIKE LOWER(CONCAT('%', CAST(:clientePessoaNome AS string), '%')))
          AND (:status IS NULL OR d.status = :status)
          AND (:dataEmissaoInicio IS NULL OR d.dataEmissao >= :dataEmissaoInicio)
          AND (:dataEmissaoFim IS NULL OR d.dataEmissao <= :dataEmissaoFim)
    """)
    Page<Documento> findAllWithFilters(
            Pageable pageable,
            @Param("clienteId")          Long            clienteId,
            @Param("emitenteId")         Long            emitenteId,
            @Param("clientePessoaNome")  String          clientePessoaNome,
            @Param("status")             DocumentoStatus status,
            @Param("dataEmissaoInicio")  LocalDate       dataEmissaoInicio,
            @Param("dataEmissaoFim")     LocalDate       dataEmissaoFim
    );
}
