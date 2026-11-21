import { ErroApi } from '../../shared/api/erros';
import type { PaginaDto } from '../../shared/api/pagina';

/*
 * Contratantes de mentira para os modelos do kit no catálogo (/design-system?kit=...). Mesma forma do
 * TenantResponseDto da ero-api; a "API" responde com um atraso curto para o esqueleto e o carregando aparecerem.
 */

export type ContratanteDemo = {
  id: string;
  nome: string;
  documento: string | null;
  email: string | null;
  ativo: boolean;
  limiteUsuarios: number | null;
  usuariosAtivos: number;
  createdAt: string;
  updatedAt: string | null;
  criadoPorNome: string | null;
  alteradoPorNome: string | null;
  version: number;
};

const NOMES = [
  'Demo Solar',
  'Demo Marina',
  'Clínica Bem Viver',
  'Construtora Horizonte',
  'Padaria Pão de Ouro',
  'Escola Nova Era',
  'Transportes Rota Sul',
  'Ótica Visão Clara',
  'Academia Corpo em Forma',
  'Pet Shop Amigo Fiel',
  'Imobiliária Casa Certa',
  'Farmácia Saúde Já',
  'Restaurante Sabor Caseiro',
  'Studio de Dança Ritmo',
  'Agência Pixel Criativo',
  'Mercado Bom Preço',
  'Consultório Sorriso',
  'Oficina Motor Forte',
  'Livraria Página Viva',
  'Floricultura Jardim',
  'Hotel Mar Azul',
  'Coworking Colmeia',
  'Laboratório Vida',
];
const DOCS = ['12ABC34501DE35', '11222333000181', '12345678909', null, '45723174000110', '98765432100'];

function semAcento(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

let banco: ContratanteDemo[] = NOMES.map((nome, i) => {
  const criado = new Date(Date.UTC(2026, 3 + (i % 7), 1 + i, 13, 20 + i));
  const alterado = i % 3 === 0 ? new Date(criado.getTime() + 86_400_000 * (i + 2)) : null;
  return {
    id: `c${i + 1}`,
    nome,
    documento: DOCS[i % DOCS.length],
    email: i % 5 === 3 ? null : `contato@${semAcento(nome).replace(/[^a-z]+/g, '')}.com.br`,
    ativo: i % 6 !== 4,
    limiteUsuarios: i % 4 === 2 ? null : 5 + (i % 4) * 5,
    usuariosAtivos: 1 + (i % 5),
    createdAt: criado.toISOString(),
    updatedAt: alterado?.toISOString() ?? criado.toISOString(),
    criadoPorNome: i === 0 ? null : 'Eduardo (superadmin)',
    alteradoPorNome: alterado ? 'Ana Ribeiro' : null,
    version: alterado ? 2 : 0,
  };
});

const ATRASO_MS = 350;
const esperar = () => new Promise((r) => setTimeout(r, ATRASO_MS));

export type FiltrosDemo = { busca?: string; ativo?: boolean; page: number; size: number };

export type CorpoDemo = {
  nome: string;
  documento: string | null;
  email: string | null;
  limiteUsuarios: number | null;
  administrador?: { nome: string; email: string; senha: string };
  version?: number;
};

export const contratantesDemo = {
  async listar({ busca, ativo, page, size }: FiltrosDemo): Promise<PaginaDto<ContratanteDemo>> {
    await esperar();
    const q = semAcento(busca?.trim() ?? '');
    const doc = (busca ?? '').toUpperCase().replace(/[^0-9A-Z]/g, '');
    const todos = banco
      .filter((c) => ativo === undefined || c.ativo === ativo)
      .filter((c) => !q || semAcento(c.nome).includes(q) || (!!doc && !!c.documento?.includes(doc)))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    return {
      conteudo: todos.slice(page * size, (page + 1) * size),
      pagina: page,
      tamanho: size,
      totalElementos: todos.length,
      totalPaginas: Math.ceil(todos.length / size),
    };
  },

  async buscar(id: string): Promise<ContratanteDemo> {
    await esperar();
    const c = banco.find((x) => x.id === id);
    if (!c) throw new ErroApi({ status: 404 });
    return { ...c };
  },

  /** Para mostrar o erro no campo: e-mail do administrador "usado@demo.com.br" volta 400 em `administrador.email`. */
  async criar(corpo: CorpoDemo): Promise<ContratanteDemo> {
    await esperar();
    if (corpo.administrador?.email === 'usado@demo.com.br') {
      throw new ErroApi({
        status: 400,
        codigo: 'VALIDACAO',
        detail: 'Existem campos inválidos.',
        erros: [{ campo: 'administrador.email', mensagem: 'Este e-mail já é de outro usuário.' }],
      });
    }
    const agora = new Date().toISOString();
    const novo: ContratanteDemo = {
      id: `c${banco.length + 1}-${Date.now()}`,
      nome: corpo.nome,
      documento: corpo.documento,
      email: corpo.email,
      ativo: true,
      limiteUsuarios: corpo.limiteUsuarios,
      usuariosAtivos: 1,
      createdAt: agora,
      updatedAt: agora,
      criadoPorNome: 'Eduardo (superadmin)',
      alteradoPorNome: null,
      version: 0,
    };
    banco = [...banco, novo];
    return novo;
  },

  /** Para mostrar o 409: nome com "conflito" volta como se outra pessoa tivesse salvo antes. */
  async alterar(id: string, corpo: CorpoDemo): Promise<ContratanteDemo> {
    await esperar();
    const atual = banco.find((x) => x.id === id);
    if (!atual) throw new ErroApi({ status: 404 });
    if (/conflito/i.test(corpo.nome) || corpo.version !== atual.version) {
      throw new ErroApi({ status: 409, codigo: 'CONFLITO' });
    }
    const salvo: ContratanteDemo = {
      ...atual,
      nome: corpo.nome,
      documento: corpo.documento,
      email: corpo.email,
      limiteUsuarios: corpo.limiteUsuarios,
      updatedAt: new Date().toISOString(),
      alteradoPorNome: 'Eduardo (superadmin)',
      version: atual.version + 1,
    };
    banco = banco.map((x) => (x.id === id ? salvo : x));
    return salvo;
  },

  async alternar(id: string, ativo: boolean): Promise<void> {
    await esperar();
    banco = banco.map((x) => (x.id === id ? { ...x, ativo, version: x.version + 1 } : x));
  },
};

/*
 * Cores de registro de mentira para o catálogo do TCor e do TCorMarca (Filiais): no produto elas vêm do banco
 * (#RRGGBB). Ficam aqui, em .ts de dados, e não num .tsx: a tela nunca escreve cor.
 */
export const CORES_DE_REGISTRO_DEMO = {
  /** uma sugerida (Verde, --cor-registro-2) gravada em minúsculas, como pode vir do banco */
  sugerida: '#10b981',
  /** uma cor que não é sugerida: o TCor mostra "Outra (#A1B2C3)" */
  outra: '#A1B2C3',
  /** cores-limite do anel --line-strong: amarelo puro (some no claro sem anel) e quase preto (some no escuro) */
  amareloLimite: '#FFFF00',
  pretoLimite: '#111111',
  /** fora do formato: o kit não aplica (bolinha neutra) */
  invalida: 'red;background:url(x)',
} as const;
