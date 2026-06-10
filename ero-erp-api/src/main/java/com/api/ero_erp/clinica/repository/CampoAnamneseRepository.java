package com.api.ero_erp.clinica.repository;

import com.api.ero_erp.clinica.entity.CampoAnamnese;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CampoAnamneseRepository extends JpaRepository<CampoAnamnese, Long> {

    List<CampoAnamnese> findByTemplateIdOrderByOrdemAsc(Long templateId);

    Optional<CampoAnamnese> findByIdAndTemplateId(Long id, Long templateId);
}
