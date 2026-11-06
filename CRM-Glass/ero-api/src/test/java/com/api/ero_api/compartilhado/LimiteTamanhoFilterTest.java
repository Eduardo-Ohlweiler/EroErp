package com.api.ero_api.compartilhado;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.api.ero_api.compartilhado.web.LimiteTamanhoFilter;
import java.io.IOException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class LimiteTamanhoFilterTest {

    private final LimiteTamanhoFilter filtro = new LimiteTamanhoFilter(1024);

    @Test
    void contentLengthGrandeDa413SemLer() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/auth/login");
        req.setContent(new byte[2048]);
        MockHttpServletResponse res = new MockHttpServletResponse();

        filtro.doFilter(req, res, (rq, rs) -> {
            throw new AssertionError("não devia chegar no controller");
        });

        assertThat(res.getStatus()).isEqualTo(413);
    }

    @Test
    void corpoChunkedSemContentLengthParaDeSerLidoNoLimite() {
        MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/auth/login") {
            @Override
            public long getContentLengthLong() {
                return -1; // Transfer-Encoding: chunked
            }

            @Override
            public int getContentLength() {
                return -1;
            }
        };
        req.setContent(new byte[10_000]);

        assertThatThrownBy(() -> filtro.doFilter(req, new MockHttpServletResponse(),
                (rq, rs) -> rq.getInputStream().readAllBytes()))
                .isInstanceOf(IOException.class)
                .hasMessageContaining("maior que o limite");
    }

    @Test
    void corpoPequenoPassaNormal() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/auth/login");
        req.setContent(new byte[100]);
        byte[][] lido = new byte[1][];

        filtro.doFilter(req, new MockHttpServletResponse(), (rq, rs) -> lido[0] = rq.getInputStream().readAllBytes());

        assertThat(lido[0]).hasSize(100);
    }
}
