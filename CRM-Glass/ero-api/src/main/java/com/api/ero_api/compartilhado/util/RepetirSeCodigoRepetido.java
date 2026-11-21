package com.api.ero_api.compartilhado.util;

import com.api.ero_api.compartilhado.exception.ConflitoException;
import java.util.function.Supplier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Peça comum do salvar com código do registro ({@code cod_<entidade>}, ver
 * docs/01-arquitetura-backend.md, "Código do registro").
 *
 * <p>O código é o maior + 1 do contratante, lido no salvar. Dois salvando juntos leem
 * o mesmo maior, e o índice único {@code uk_<tabela>_tenant_cod_<tabela>} recusa o
 * segundo. No PostgreSQL a violação aborta a transação, e a entidade que falhou já tem
 * {@code id} e {@code version}; por isso cada tentativa roda numa transação NOVA e
 * remonta tudo a partir do DTO. Regras:
 * <ul>
 *   <li>o {@code criar} do service NÃO leva {@code @Transactional} (chamar outro método do
 *       próprio service não abre transação nova, porque passa por fora do proxy); chamado
 *       com transação aberta, recusa com {@link IllegalStateException};</li>
 *   <li>a tentativa valida, pede o número ({@code buscarProximoCodigo}) imediatamente antes
 *       do {@code saveAndFlush} e devolve o DTO de resposta;</li>
 *   <li>só repete quando a causa é a violação do índice do código; outra violação sobe na
 *       hora para quem chamou (e para o {@code GlobalExceptionHandler});</li>
 *   <li>no máximo {@value #TENTATIVAS} tentativas; na última recusa, 409
 *       "Não foi possível gerar o código. Tente salvar de novo.";</li>
 *   <li>evento de log entra na transação da tentativa; e-mail e outros efeitos de fora,
 *       só depois que {@link #executar} devolver, para não sair em dobro.</li>
 * </ul>
 */
@Component
public class RepetirSeCodigoRepetido {

    static final int TENTATIVAS = 3;

    private static final Logger log = LoggerFactory.getLogger(RepetirSeCodigoRepetido.class);

    private final TransactionTemplate transacao;

    public RepetirSeCodigoRepetido(PlatformTransactionManager transactionManager) {
        this.transacao = new TransactionTemplate(transactionManager);
        this.transacao.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRED);
    }

    /**
     * @param indiceDoCodigo nome do índice único do código (ex.: {@code uk_pessoa_tenant_cod_pessoa})
     * @param tentativa      o salvar completo, a partir do DTO; roda numa transação própria a cada vez
     */
    public <T> T executar(String indiceDoCodigo, Supplier<T> tentativa) {
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            throw new IllegalStateException("O salvar com código precisa da própria transação.");
        }
        for (int vez = 1; ; vez++) {
            try {
                return transacao.execute(status -> tentativa.get());
            } catch (DataIntegrityViolationException e) {
                if (!RestricaoViolada.violou(e, indiceDoCodigo)) {
                    throw e;
                }
                if (vez >= TENTATIVAS) {
                    log.warn("Código repetido em {} tentativas seguidas ({})", TENTATIVAS, indiceDoCodigo);
                    throw new ConflitoException("Não foi possível gerar o código. Tente salvar de novo.");
                }
                log.debug("Código repetido ({}); tentativa {} de {}", indiceDoCodigo, vez + 1, TENTATIVAS);
            }
        }
    }
}
