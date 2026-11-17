package com.api.ero_api.compartilhado;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.api.ero_api.compartilhado.exception.ConflitoException;
import com.api.ero_api.compartilhado.util.RepetirSeCodigoRepetido;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import org.hibernate.exception.ConstraintViolationException;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;
import org.springframework.transaction.support.DefaultTransactionStatus;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * A peça de retentativa do código, sem banco: um gerenciador de transação de mentira
 * conta as transações abertas, confirmadas e desfeitas. O caso real (dois cadastros
 * simultâneos no PostgreSQL) está no {@code AuxiliarIntegracaoTest}.
 */
class RepetirSeCodigoRepetidoTest {

    private static final String INDICE = "uk_tipo_cadastro_tenant_cod_tipo_cadastro";

    private final TransacoesContadas transacoes = new TransacoesContadas();
    private final RepetirSeCodigoRepetido repetir = new RepetirSeCodigoRepetido(transacoes);

    @Test
    void semViolacaoUmaTentativaNumaTransacao() {
        String r = repetir.executar(INDICE, () -> {
            assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isTrue();
            return "ok";
        });
        assertThat(r).isEqualTo("ok");
        assertThat(transacoes.abertas).isEqualTo(1);
        assertThat(transacoes.confirmadas).isEqualTo(1);
    }

    @Test
    void codigoRepetidoTentaDeNovoNumaTransacaoNova() {
        AtomicInteger vez = new AtomicInteger();
        String r = repetir.executar(INDICE, () -> {
            if (vez.incrementAndGet() == 1) {
                throw violacao(INDICE);
            }
            return "na segunda";
        });
        assertThat(r).isEqualTo("na segunda");
        assertThat(vez.get()).isEqualTo(2);
        assertThat(transacoes.abertas).as("uma transação por tentativa").isEqualTo(2);
        assertThat(transacoes.desfeitas).isEqualTo(1);
        assertThat(transacoes.confirmadas).isEqualTo(1);
    }

    @Test
    void nomeDoIndiceSemDiferenciarCaixa() {
        AtomicInteger vez = new AtomicInteger();
        repetir.executar(INDICE, () -> {
            if (vez.incrementAndGet() == 1) {
                throw violacao(INDICE.toUpperCase());
            }
            return "ok";
        });
        assertThat(vez.get()).isEqualTo(2);
    }

    @Test
    void naTerceiraRecusa409() {
        AtomicInteger vez = new AtomicInteger();
        assertThatThrownBy(() -> repetir.executar(INDICE, () -> {
            vez.incrementAndGet();
            throw violacao(INDICE);
        }))
                .isInstanceOf(ConflitoException.class)
                .hasMessage("Não foi possível gerar o código. Tente salvar de novo.");
        assertThat(vez.get()).isEqualTo(3);
        assertThat(transacoes.desfeitas).isEqualTo(3);
    }

    @Test
    void outraViolacaoSobeNaHoraSemRepetir() {
        AtomicInteger vez = new AtomicInteger();
        DataIntegrityViolationException outra = violacao("uk_tipo_cadastro_tenant_nome_busca");
        assertThatThrownBy(() -> repetir.executar(INDICE, () -> {
            vez.incrementAndGet();
            throw outra;
        })).isSameAs(outra);
        assertThat(vez.get()).isEqualTo(1);

        AtomicInteger semNome = new AtomicInteger();
        assertThatThrownBy(() -> repetir.executar(INDICE, () -> {
            semNome.incrementAndGet();
            throw new DataIntegrityViolationException("sem constraint conhecida");
        })).isInstanceOf(DataIntegrityViolationException.class);
        assertThat(semNome.get()).isEqualTo(1);
    }

    @Test
    void outraExcecaoSobeNaHora() {
        AtomicInteger vez = new AtomicInteger();
        assertThatThrownBy(() -> repetir.executar(INDICE, () -> {
            vez.incrementAndGet();
            throw new IllegalArgumentException("regra");
        })).isInstanceOf(IllegalArgumentException.class);
        assertThat(vez.get()).isEqualTo(1);
    }

    /** Com transação já aberta, a retentativa seria inútil (a transação abortada é a mesma): recusa. */
    @Test
    void chamadoComTransacaoAbertaRecusa() {
        List<String> chamou = new ArrayList<>();
        TransactionTemplate externa = new TransactionTemplate(transacoes);
        assertThatThrownBy(() -> externa.executeWithoutResult(s ->
                repetir.executar(INDICE, () -> chamou.add("não devia"))))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("O salvar com código precisa da própria transação.");
        assertThat(chamou).isEmpty();
    }

    private static DataIntegrityViolationException violacao(String restricao) {
        return new DataIntegrityViolationException("violação",
                new ConstraintViolationException("duplicate key", new SQLException("23505"), restricao));
    }

    /** Gerenciador de transação sem recurso: só conta. */
    private static final class TransacoesContadas extends AbstractPlatformTransactionManager {

        int abertas;
        int confirmadas;
        int desfeitas;

        @Override
        protected Object doGetTransaction() {
            return new Object();
        }

        @Override
        protected void doBegin(Object transaction, TransactionDefinition definition) {
            abertas++;
        }

        @Override
        protected void doCommit(DefaultTransactionStatus status) {
            confirmadas++;
        }

        @Override
        protected void doRollback(DefaultTransactionStatus status) {
            desfeitas++;
        }
    }
}
