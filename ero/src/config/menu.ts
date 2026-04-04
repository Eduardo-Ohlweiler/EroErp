import type { MenuItem } from "../types/MenuItem"
import { FaUsers, FaBox, FaCogs, FaPhone } from "react-icons/fa"

export const menu: MenuItem[] = [
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
      },
      {
        label: "Auxiliares",
        icon: FaPhone,
        children: [
          {
            label: "Tipo Telefone",
            path: "/tipo-telefone"
          }
        ]
      }
    ]
  }
]