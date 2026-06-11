package com.api.ero_erp.clinica.repository;

import com.api.ero_erp.clinica.entity.ItemPlanoAlimentar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ItemPlanoAlimentarRepository extends JpaRepository<ItemPlanoAlimentar, Long> {

    Optional<ItemPlanoAlimentar> findByIdAndPlanoId(Long id, Long planoId);
}
