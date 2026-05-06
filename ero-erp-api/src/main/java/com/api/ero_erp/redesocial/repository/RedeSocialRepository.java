package com.api.ero_erp.redesocial.repository;

import com.api.ero_erp.redesocial.entity.RedeSocial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RedeSocialRepository extends JpaRepository<RedeSocial, Long> {

    List<RedeSocial> findByPessoaIdAndClienteId(Long pessoaId, Long clienteId);
    Optional<RedeSocial> findByIdAndClienteId(Long id, Long clienteId);
}
