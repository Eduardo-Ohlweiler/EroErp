package com.api.ero_erp;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.api.ero_erp.auxiliarproduto.repository.CategoriaProdutoRepository;
import com.api.ero_erp.auxiliarproduto.repository.GrupoProdutoRepository;
import com.api.ero_erp.auxiliarproduto.repository.MarcaProdutoRepository;
import com.api.ero_erp.auxiliarproduto.repository.SubgrupoProdutoRepository;
import com.api.ero_erp.catalogo.entity.UnidadeMedida;
import com.api.ero_erp.catalogo.repository.UnidadeMedidaRepository;
import com.api.ero_erp.compromisso.repository.CompromissoRepository;
import com.api.ero_erp.consulta.repository.ConsultaRepository;
import com.api.ero_erp.estoque.repository.EstoqueMovimentacaoRepository;
import com.api.ero_erp.estoque.repository.EstoqueRepository;
import com.api.ero_erp.filial.repository.FilialRepository;
import com.api.ero_erp.loginlog.repository.LoginLogRepository;
import com.api.ero_erp.permissao.entity.UsuarioPermissao;
import com.api.ero_erp.permissao.enums.NivelAcesso;
import com.api.ero_erp.permissao.enums.Tela;
import com.api.ero_erp.permissao.repository.UsuarioPermissaoRepository;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.pessoa.enums.TipoPessoa;
import com.api.ero_erp.pessoa.repository.PessoaRepository;
import com.api.ero_erp.produto.repository.ProdutoRepository;
import com.api.ero_erp.refreshtoken.repository.RefreshTokenRepository;
import com.api.ero_erp.servico.repository.ServicoRepository;
import com.api.ero_erp.tenant.entity.Tenant;
import com.api.ero_erp.tenant.repository.TenantRepository;
import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.usuario.enums.Role;
import com.api.ero_erp.usuario.repository.UsuarioRepository;
import com.api.ero_erp.whatsapp.repository.WhatsappConexaoRepository;
import com.api.ero_erp.whatsapp.repository.WhatsappConfiguracaoRepository;
import com.api.ero_erp.whatsapp.repository.WhatsappServidorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Base dos testes de integração.
 *
 * <p>Roda contra um PostgreSQL local dedicado ({@code ero_erp_test}), não H2 e
 * não Testcontainers — o projeto não usa Docker, e H2 não tem {@code unaccent}
 * nem o mesmo comportamento de {@code NULL} em constraint única, o que daria
 * falsa confiança exatamente onde dói.
 *
 * <p>Monta o cenário canônico de isolamento: dois tenants completos, cada um
 * com o seu administrador, mais o superadmin do tenant raiz.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class AbstractIntegrationTest {

    protected static final String SENHA_PADRAO = "SenhaDeTeste123";

    @Autowired protected MockMvc mockMvc;
    @Autowired protected ObjectMapper objectMapper;
    @Autowired protected TenantRepository tenantRepository;
    @Autowired protected UsuarioRepository usuarioRepository;
    @Autowired protected LoginLogRepository loginLogRepository;
    @Autowired protected RefreshTokenRepository refreshTokenRepository;
    @Autowired protected PessoaRepository pessoaRepository;
    @Autowired protected FilialRepository filialRepository;
    @Autowired protected CompromissoRepository compromissoRepository;
    @Autowired protected ConsultaRepository consultaRepository;
    @Autowired protected ServicoRepository servicoRepository;
    @Autowired protected EstoqueMovimentacaoRepository estoqueMovimentacaoRepository;
    @Autowired protected EstoqueRepository estoqueRepository;
    @Autowired protected ProdutoRepository produtoRepository;
    @Autowired protected SubgrupoProdutoRepository subgrupoProdutoRepository;
    @Autowired protected GrupoProdutoRepository grupoProdutoRepository;
    @Autowired protected CategoriaProdutoRepository categoriaProdutoRepository;
    @Autowired protected MarcaProdutoRepository marcaProdutoRepository;
    @Autowired protected UnidadeMedidaRepository unidadeMedidaRepository;
    @Autowired protected UsuarioPermissaoRepository usuarioPermissaoRepository;
    @Autowired protected WhatsappConexaoRepository whatsappConexaoRepository;
    @Autowired protected WhatsappConfiguracaoRepository whatsappConfiguracaoRepository;
    @Autowired protected WhatsappServidorRepository whatsappServidorRepository;
    @Autowired protected PasswordEncoder passwordEncoder;

    protected Tenant tenantA;
    protected Tenant tenantB;
    protected Usuario adminA;
    protected Usuario adminB;
    protected Usuario userA;
    protected Usuario superadmin;

    @BeforeEach
    void montarCenario() {
        // Ordem de dependência: refresh_token → login_log → movimentação →
        // consulta → compromisso → estoque → produto → subgrupo → grupo,
        // categoria, marca → servico → whatsapp → filial → pessoa →
        // usuario_permissao → usuario → tenant.
        // A conexão de WhatsApp aponta para a filial: sai antes dela. O
        // servidor é global e o modo é do tenant; saem junto, por limpeza.
        // A saída por consulta aponta para a consulta: a movimentação sai
        // antes dela. A consulta leva os itens (ON DELETE CASCADE) e a
        // reconsulta aponta para a própria tabela, o que um DELETE só resolve.
        // O compromisso aponta para filial, pessoa e usuário: sai antes de
        // todos, e leva os convidados (ON DELETE CASCADE).
        // O produto aponta para a pessoa (fornecedor) e o estoque para a
        // filial: os dois saem antes delas. A unidade de medida é seed global.
        // Apagar o serviço leva junto os valores por filial, e apagar o
        // tenant leva o contador de código: as FKs são ON DELETE CASCADE.
        // Apagar a pessoa leva junto telefone, e-mail, rede social, endereço,
        // vínculos e os tipos de cadastro: as FKs são ON DELETE CASCADE.
        // A filial não tem cascade (aponta para a pessoa e para a matriz):
        // sai antes, num DELETE só, que resolve a autorreferência de uma vez.
        refreshTokenRepository.deleteAllInBatch();
        loginLogRepository.deleteAllInBatch();
        estoqueMovimentacaoRepository.deleteAllInBatch();
        consultaRepository.deleteAllInBatch();
        compromissoRepository.deleteAllInBatch();
        estoqueRepository.deleteAllInBatch();
        produtoRepository.deleteAllInBatch();
        subgrupoProdutoRepository.deleteAllInBatch();
        grupoProdutoRepository.deleteAllInBatch();
        categoriaProdutoRepository.deleteAllInBatch();
        marcaProdutoRepository.deleteAllInBatch();
        servicoRepository.deleteAllInBatch();
        whatsappConexaoRepository.deleteAllInBatch();
        whatsappConfiguracaoRepository.deleteAllInBatch();
        whatsappServidorRepository.deleteAllInBatch();
        filialRepository.deleteAllInBatch();
        pessoaRepository.deleteAllInBatch();
        usuarioPermissaoRepository.deleteAllInBatch();
        usuarioRepository.deleteAllInBatch();
        tenantRepository.deleteAllInBatch();

        tenantA = tenantRepository.save(new Tenant("Empresa A"));
        tenantB = tenantRepository.save(new Tenant("Empresa B"));
        Tenant raiz = tenantRepository.save(new Tenant("EroErp Admin"));

        adminA = criarUsuario(tenantA, "admin.a@teste.local", Role.ADMIN);
        userA = criarUsuario(tenantA, "user.a@teste.local", Role.USER);
        adminB = criarUsuario(tenantB, "admin.b@teste.local", Role.ADMIN);
        superadmin = criarUsuario(raiz, "root@teste.local", Role.SUPERADMIN);
    }

    protected Usuario criarUsuario(Tenant tenant, String email, Role role) {
        Usuario usuario = new Usuario();
        usuario.setTenant(tenant);
        usuario.setNome("Usuario " + email);
        usuario.setEmail(email);
        usuario.setSenha(passwordEncoder.encode(SENHA_PADRAO));
        usuario.setRole(role);
        return usuarioRepository.save(usuario);
    }

    /**
     * Pessoa jurídica gravada direto no banco, para os módulos que só a
     * referenciam (filial). O cadastro de pessoa tem os testes dele.
     */
    protected Pessoa salvarPessoa(Tenant tenant, String nome) {
        Pessoa pessoa = new Pessoa();
        pessoa.setTenant(tenant);
        pessoa.setNome(nome);
        pessoa.setTipoPessoa(TipoPessoa.PESSOA_JURIDICA);
        return pessoaRepository.save(pessoa);
    }

    /** O id da unidade de medida do seed (021) pela sigla. */
    protected UUID unidade(String sigla) {
        return unidadeMedidaRepository.findAllByAtivoTrueOrderBySigla().stream()
                .filter(u -> u.getSigla().equals(sigla))
                .map(UnidadeMedida::getId)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Seed sem a unidade " + sigla));
    }

    /** Libera uma tela ao usuário direto no banco — o caminho do cadastro tem teste próprio. */
    protected void conceder(Usuario usuario, Tela tela, NivelAcesso nivel) {
        UsuarioPermissao permissao = new UsuarioPermissao();
        permissao.setUsuario(usuario);
        permissao.setTenant(usuario.getTenant());
        permissao.setTela(tela);
        permissao.setNivel(nivel);
        usuarioPermissaoRepository.save(permissao);
    }

    /** Autentica de verdade, pelo endpoint — o token sai igual ao de produção. */
    protected String autenticar(String email) throws Exception {
        return autenticar(email, SENHA_PADRAO);
    }

    protected String autenticar(String email, String senha) throws Exception {
        String corpo = mockMvc.perform(post("/auth/login")
                        .contentType("application/json")
                        .content("""
                                {"email":"%s","senha":"%s"}
                                """.formatted(email, senha)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        return "Bearer " + objectMapper.readTree(corpo).get("accessToken").asText();
    }
}
