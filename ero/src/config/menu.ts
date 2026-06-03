import type { MenuItem } from "../types/MenuItem"
import { FaUsers, FaCogs, FaUserShield, FaCog, FaClipboardList, FaFileInvoice, FaWhatsapp, FaMobileAlt, FaCalendarAlt, FaCommentDots, FaTachometerAlt, FaBoxOpen, FaTag, FaWarehouse, FaExchangeAlt, FaSlidersH, FaPlug /*, FaPhone, FaTools*/} from "react-icons/fa"

export const menu: MenuItem[] = [
  {
    label: "Dashboard",
    icon:  FaTachometerAlt,
    path:  "/",
    roles: ["SUPERADMIN", "ADMIN", "COMPROMISSO", "ESTOQUE", "ESTOQUE_GET"],
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
    ]
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