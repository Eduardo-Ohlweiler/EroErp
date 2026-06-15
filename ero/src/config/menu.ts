import type { MenuItem } from "../types/MenuItem"
import { FaUsers, FaCogs, FaUserShield, FaCog, FaClipboardList, FaFileInvoice, FaWhatsapp, FaCalendarAlt, FaCommentDots, FaTachometerAlt, FaBoxOpen, FaTag, FaWarehouse, FaExchangeAlt, FaSlidersH, FaPlug, FaStethoscope, FaUniversity, FaCreditCard, FaMoneyBill, FaArrowDown, FaArrowUp, FaHandHoldingUsd, FaList, FaDumbbell, FaRuler, FaFileAlt /*, FaPhone, FaTools*/} from "react-icons/fa"

export const menu: MenuItem[] = [
  {
    label: "Dashboards",
    icon:  FaTachometerAlt,
    roles: ["SUPERADMIN", "ADMIN", "COMPROMISSO", "ESTOQUE", "ESTOQUE_GET", "CLINICA", "CLINICA_GET", "FINANCEIRO", "FINANCEIRO_GET"],
    children: [
      {
        label: "Geral",
        path:  "/",
        icon:  FaTachometerAlt,
        roles: ["SUPERADMIN", "ADMIN", "COMPROMISSO", "ESTOQUE", "ESTOQUE_GET"],
      },
      {
        label: "Consultas",
        path:  "/dashboards/consultas",
        icon:  FaStethoscope,
        roles: ["SUPERADMIN", "ADMIN", "CLINICA", "CLINICA_GET"],
      },
      {
        label: "Financeiro",
        path:  "/dashboards/financeiro",
        icon:  FaUniversity,
        roles: ["SUPERADMIN", "ADMIN", "FINANCEIRO", "FINANCEIRO_GET"],
      },
      {
        label: "Auxiliar Dashboards",
        icon:  FaCogs,
        roles: ["SUPERADMIN", "ADMIN"],
        children: [
          { label: "Config. de Pendências", path: "/dashboards/configuracao-pendencias", icon: FaCog },
        ],
      },
    ],
  },
  {
    label: "Agenda",
    icon:  FaCalendarAlt,
    roles: ["SUPERADMIN", "ADMIN", "COMPROMISSO"],
    children: [
      {
        label: "Calendário",
        path:  "/agenda",
        icon:  FaCalendarAlt,
      },
      {
        label: "Auxiliar agenda",
        icon:  FaCogs,
        children: [
          { label: "Config. de Mensagens", path: "/agenda/configuracao-mensagem", icon: FaCommentDots },
        ],
      },
    ],
  },
  {
    label: "Cadastros",
    icon: FaClipboardList,
    roles: ["SUPERADMIN", "ADMIN", "PESSOA", "PESSOA_GET", "PESSOA_POST", "PRODUTO", "PRODUTO_GET", "ESTOQUE", "ESTOQUE_GET", "ESTOQUE_AJUSTE", "ESTOQUE_TRANSFERENCIA"],
    children: [
      {
        label: "Pessoas",
        path:  "/pessoas",
        icon:  FaUsers
      },
      {
        label: "Emitentes",
        path: "/emitentes",
        icon: FaFileInvoice
      },
      {
        label: "Produtos",
        path:  "/produtos",
        icon:  FaBoxOpen,
        roles: ["SUPERADMIN", "ADMIN", "PRODUTO", "PRODUTO_GET"]
      },
      {
        label: "Estoque",
        icon:  FaWarehouse,
        roles: ["SUPERADMIN", "ADMIN", "ESTOQUE", "ESTOQUE_GET", "ESTOQUE_AJUSTE", "ESTOQUE_TRANSFERENCIA"],
        children: [
          {
            label: "Estoque",
            path:  "/estoque",
            icon:  FaBoxOpen,
            roles: ["SUPERADMIN", "ADMIN", "ESTOQUE", "ESTOQUE_GET"],
          },
          {
            label: "Ajuste de Estoque",
            path:  "/estoque/ajustes",
            icon:  FaSlidersH,
            roles: ["SUPERADMIN", "ADMIN", "ESTOQUE", "ESTOQUE_AJUSTE"],
          },
          {
            label: "Transferência de Estoque",
            path:  "/estoque/transferencias",
            icon:  FaExchangeAlt,
            roles: ["SUPERADMIN", "ADMIN", "ESTOQUE", "ESTOQUE_TRANSFERENCIA"],
          },
        ]
      },
      {
        label: "Auxiliar Produto",
        icon:  FaTag,
        roles: ["SUPERADMIN", "ADMIN", "PRODUTO", "PRODUTO_GET", "GRUPO", "GRUPO_GET", "CATEGORIA", "CATEGORIA_GET", "MARCA", "MARCA_GET"],
        children: [
          { label: "Grupos",     path: "/produtos/grupos",     icon: FaCog },
          { label: "Subgrupos",  path: "/produtos/subgrupos",  icon: FaCog },
          { label: "Categorias", path: "/produtos/categorias", icon: FaCog },
          { label: "Marcas",     path: "/produtos/marcas",     icon: FaCog }
        ]
      },
    ]
  },
  {
    label: "Documentos",
    icon:  FaFileAlt,
    roles: ["SUPERADMIN", "ADMIN", "DOCUMENTO", "DOCUMENTO_GET", "MODELO_DOCUMENTO", "MODELO_DOCUMENTO_GET"],
    children: [
      {
        label: "Documentos",
        path:  "/documentos",
        icon:  FaFileInvoice,
        roles: ["SUPERADMIN", "ADMIN", "DOCUMENTO", "DOCUMENTO_GET"],
      },
      {
        label: "Modelos de Documentos",
        path:  "/documentos/modelos",
        icon:  FaClipboardList,
        roles: ["SUPERADMIN", "ADMIN", "MODELO_DOCUMENTO", "MODELO_DOCUMENTO_GET"],
      },
      {
        label: "Auxiliar documentos",
        icon:  FaCogs,
        roles: ["SUPERADMIN", "ADMIN"],
        children: [
          { label: "Config. de Documentos", path: "/documentos/configuracao-documento", icon: FaCog, roles: ["SUPERADMIN", "ADMIN"] },
        ],
      },
    ],
  },
  {
    label: "Clínica",
    icon:  FaStethoscope,
    roles: ["SUPERADMIN", "ADMIN", "CLINICA", "CLINICA_GET", "ANAMNESE", "ANAMNESE_GET", "TEMPLATE_ANAMNESE", "TEMPLATE_ANAMNESE_GET", "PLANO_ALIMENTAR", "PLANO_ALIMENTAR_GET", "REFEICAO", "REFEICAO_GET"],
    children: [
      {
        label: "Consultas",
        path:  "/clinica/consultas",
        icon:  FaStethoscope,
        roles: ["SUPERADMIN", "ADMIN", "CLINICA", "CLINICA_GET"],
      },
      {
        label: "Fichas de Anamnese",
        path:  "/clinica/fichas-anamnese",
        icon:  FaClipboardList,
        roles: ["SUPERADMIN", "ADMIN", "ANAMNESE", "ANAMNESE_GET"],
      },
      {
        label: "Planos Alimentares",
        path:  "/clinica/planos-alimentares",
        icon:  FaClipboardList,
        roles: ["SUPERADMIN", "ADMIN", "PLANO_ALIMENTAR", "PLANO_ALIMENTAR_GET"],
      },
      {
        label: "Auxiliar Clínica",
        icon:  FaCogs,
        roles: ["SUPERADMIN", "ADMIN", "TEMPLATE_ANAMNESE", "TEMPLATE_ANAMNESE_GET", "REFEICAO", "REFEICAO_GET"],
        children: [
          {
            label: "Templates de Anamnese",
            path:  "/clinica/templates-anamnese",
            icon:  FaCog,
            roles: ["SUPERADMIN", "ADMIN", "TEMPLATE_ANAMNESE", "TEMPLATE_ANAMNESE_GET"],
          },
          {
            label: "Refeições",
            path:  "/clinica/refeicoes",
            icon:  FaCog,
            roles: ["SUPERADMIN", "ADMIN", "REFEICAO", "REFEICAO_GET"],
          },
        ],
      },
    ],
  },
  {
    label: "Gym",
    icon:  FaDumbbell,
    roles: ["SUPERADMIN", "ADMIN", "PLANO_TREINO", "PLANO_TREINO_GET", "EXERCICIO", "EXERCICIO_GET"],
    children: [
      {
        label: "Planos de Treino",
        path:  "/gym/planos-treino",
        icon:  FaClipboardList,
        roles: ["SUPERADMIN", "ADMIN", "PLANO_TREINO", "PLANO_TREINO_GET"],
      },
      {
        label: "Auxiliar Gym",
        icon:  FaCogs,
        roles: ["SUPERADMIN", "ADMIN", "EXERCICIO", "EXERCICIO_GET"],
        children: [
          {
            label: "Exercícios",
            path:  "/gym/exercicios",
            icon:  FaCog,
            roles: ["SUPERADMIN", "ADMIN", "EXERCICIO", "EXERCICIO_GET"],
          },
        ],
      },
    ],
  },
  {
    label: "Avaliação Física",
    icon:  FaRuler,
    roles: ["SUPERADMIN", "ADMIN", "AVALIACAO_FISICA", "AVALIACAO_FISICA_GET"],
    children: [
      {
        label: "Avaliações",
        path:  "/avaliacao/avaliacoes-fisicas",
        icon:  FaClipboardList,
        roles: ["SUPERADMIN", "ADMIN", "AVALIACAO_FISICA", "AVALIACAO_FISICA_GET"],
      },
    ],
  },
  {
    label: "Financeiro",
    icon:  FaUniversity,
    roles: ["SUPERADMIN", "ADMIN", "FINANCEIRO", "FINANCEIRO_GET"],
    children: [
      {
        label: "Contas a Pagar",
        icon:  FaArrowDown,
        children: [
          { label: "Gerenciar", path: "/financeiro/contas-pagar", icon: FaList },
        ],
      },
      {
        label: "Contas a Receber",
        icon:  FaArrowUp,
        children: [
          { label: "Gerenciar", path: "/financeiro/contas-receber", icon: FaList },
        ],
      },
      {
        label: "Pagar Contas",
        path:  "/financeiro/pagar-contas",
        icon:  FaHandHoldingUsd,
      },
      {
        label: "Lançamentos",
        path:  "/financeiro/lancamentos",
        icon:  FaExchangeAlt,
      },
      {
        label: "Transferências",
        path:  "/financeiro/transferencias",
        icon:  FaExchangeAlt,
      },
      {
        label: "Auxiliar financeiro",
        icon:  FaCogs,
        children: [
          { label: "Contas Financeiras",   path: "/financeiro/contas",           icon: FaMoneyBill  },
          { label: "Tipos de Cobrança",    path: "/financeiro/tipos-cobranca",   icon: FaCog        },
          { label: "Formas de Pagamento",  path: "/financeiro/formas-pagamento", icon: FaCreditCard },
        ],
      },
    ],
  },
  {
    label: "Integrações",
    icon:  FaPlug,
    roles: ["SUPERADMIN", "ADMIN"],
    children: [
      { label: "WhatsApp — Instâncias", path: "/whatsapp/instancias", icon: FaWhatsapp },
    ]
  },
  {
    label: "Administração",
    icon: FaUserShield,
    roles: ["SUPERADMIN"],
    children: [
      { label: "Clientes",          path: "/clientes",               icon: FaUsers },
      { label: "Usuários",          path: "/usuarios",               icon: FaUsers },
      { label: "Config. WhatsApp",  path: "/whatsapp/config-global", icon: FaWhatsapp },
      {
        label: "Auxiliar administrativo",
        icon: FaCogs,
        children: [
          { label: "Cidades",                path: "/cidades",           icon: FaCog },
          { label: "Estados",                path: "/estados",           icon: FaCog },
          { label: "Tipos de Cadastros",     path: "/tipos/cadastro",    icon: FaCog },
          { label: "Tipos de Email",         path: "/tipos/email",       icon: FaCog },
          { label: "Tipos de Endereço",      path: "/tipos/endereco",    icon: FaCog },
          { label: "Tipos de Redes sociais", path: "/tipos/redesocial",  icon: FaCog },
          { label: "Tipos de Telefone",      path: "/tipos/telefone",    icon: FaCog }
        ]
      },
      {
        label: "Tabelas Produto",
        icon: FaBoxOpen,
        children: [
          { label: "Tipos de Produto",   path: "/tabelas/tipo-produto",   icon: FaCog },
          { label: "Unidades de Medida", path: "/tabelas/unidade-medida", icon: FaCog },
          { label: "NCM",                path: "/tabelas/ncm",            icon: FaCog },
          { label: "Origens de Produto", path: "/tabelas/origem-produto", icon: FaCog },
          { label: "CEST",               path: "/tabelas/cest",           icon: FaCog }
        ]
      }
    ]
  },
]