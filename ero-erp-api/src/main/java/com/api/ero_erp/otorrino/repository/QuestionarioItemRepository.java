package com.api.ero_erp.otorrino.repository;

import com.api.ero_erp.otorrino.entity.QuestionarioItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionarioItemRepository extends JpaRepository<QuestionarioItem, Long> {

    @Query("""
        SELECT i FROM QuestionarioItem i
        WHERE i.questionario.id = :questionarioId
        ORDER BY i.ordem ASC
        """)
    List<QuestionarioItem> findByQuestionarioId(@Param("questionarioId") Long questionarioId);
}
