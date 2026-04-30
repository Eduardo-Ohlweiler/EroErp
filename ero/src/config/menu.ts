import type { MenuItem } from "../types/MenuItem"
import { FaUsers, FaBox, FaCogs, FaPhone } from "react-icons/fa"

export const menu: MenuItem[] = [
  {
    label: "Administração",
    icon: FaCogs,
    roles: ["SUPERADMIN"],
    children: [
      { label: "Clientes",  path: "/clientes",  icon: FaUsers },
      { label: "Usuários",  path: "/usuarios",  icon: FaUsers },
      {
        label: "Auxiliares",
        icon: FaPhone,
        children: [
          {
            label: "Tipos de Email",
            path: "/tipos/email"
          },
          {
            label: "Tipos de Redes sociais",
            path: "/tipos/redesocial"
          },
          {
            label: "Tipos de Telefone",
            path: "/tipos/telefone"
          }
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
      },
      {
        label: "Produtos",
        path: "/produtos",
        icon: FaBox
      }
    ]
  }
]