package com.api.ero_erp.gym.repository;

import com.api.ero_erp.gym.entity.ItemPlanoTreino;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ItemPlanoTreinoRepository extends JpaRepository<ItemPlanoTreino, Long> {

    Optional<ItemPlanoTreino> findByIdAndPlanoId(Long id, Long planoId);
}
