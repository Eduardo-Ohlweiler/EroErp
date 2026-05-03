import type { MenuItem } from "../types/MenuItem"
import { FaUsers, FaCogs, FaUserShield, FaCog /*, FaPhone, FaTools*/ } from "react-icons/fa"

export const menu: MenuItem[] = [
  {
    label: "Administração",
    icon: FaUserShield,
    roles: ["SUPERADMIN"],
    children: [
      { label: "Clientes",  path: "/clientes",  icon: FaUsers },
      { label: "Usuários",  path: "/usuarios",  icon: FaUsers },
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
    label: "Cadastros",
    icon: FaCogs,
    children: [
      {
        label: "Pessoas",
        path: "/pessoas",
        icon: FaUsers
      }
    ]
  }
]