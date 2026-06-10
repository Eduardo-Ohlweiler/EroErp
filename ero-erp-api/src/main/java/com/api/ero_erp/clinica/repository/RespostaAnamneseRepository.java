package com.api.ero_erp.clinica.repository;

import com.api.ero_erp.clinica.entity.RespostaAnamnese;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface RespostaAnamneseRepository extends JpaRepository<RespostaAnamnese, Long> {

    List<RespostaAnamnese> findByFichaId(Long fichaId);

    @Transactional
    void deleteByFichaId(Long fichaId);
}
