import type { MenuItem } from "../types/MenuItem"
import { FaUsers, FaCogs, FaUserShield, FaCog, FaClipboardList, FaFileInvoice, FaWhatsapp, FaMobileAlt, /*, FaPhone, FaTools*/
FaCalendarAlt} from "react-icons/fa"

export const menu: MenuItem[] = [
  {
    label: "Administração",
    icon: FaUserShield,
    roles: ["SUPERADMIN"],
    children: [
      { label: "Clientes",        path: "/clientes",               icon: FaUsers },
      { label: "Usuários",        path: "/usuarios",               icon: FaUsers },
      { label: "Config. WhatsApp", path: "/whatsapp/config-global", icon: FaCog   },
      {
        label: "Auxiliares",
        icon: FaCogs,
        children: [
          { label: "Cidades",                 path: "/cidades",           icon: FaCog },
          { label: "Estados",                 path: "/estados",           icon: FaCog },
          { label: "Tipos de Cadastros",      path: "/tipos/cadastro",    icon: FaCog },
          { label: "Tipos de Email",          path: "/tipos/email",       icon: FaCog },
          { label: "Tipos de Endereço",       path: "/tipos/endereco",    icon: FaCog },
          { label: "Tipos de Redes sociais",  path: "/tipos/redesocial",  icon: FaCog },
          { label: "Tipos de Telefone",       path: "/tipos/telefone",    icon: FaCog }
        ]
      }
    ]
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
    ],
  },
  {
    label: "WhatsApp",
    icon:  FaWhatsapp,
    roles: ["SUPERADMIN", "ADMIN"],
    children: [
      { label: "Instâncias", path: "/whatsapp/instancias", icon: FaMobileAlt },
    ]
  },
  {
    label: "Cadastros",
    icon: FaClipboardList,
    roles: ["SUPERADMIN", "ADMIN", "PESSOA", "PESSOA_GET", "PESSOA_POST"],
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
      }
    ]
  }
]