import type { MenuItem } from "../types/MenuItem"
import { FaUsers, FaCogs, FaUserShield, FaCog, FaClipboardList, FaFileInvoice, FaWhatsapp, FaCalendarAlt, FaCommentDots, FaTachometerAlt, FaBoxOpen, FaTag, FaWarehouse, FaExchangeAlt, FaSlidersH, FaPlug, FaStethoscope, FaUniversity, FaCreditCard, FaMoneyBill, FaArrowDown, FaArrowUp, FaHandHoldingUsd, FaList /*, FaPhone, FaTools*/} from "react-icons/fa"

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
    label: "Clínica",
    icon:  FaStethoscope,
    roles: ["SUPERADMIN", "ADMIN", "CLINICA", "CLINICA_GET"],
    children: [
      {
        label: "Consultas",
        path:  "/clinica/consultas",
        icon:  FaStethoscope,
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