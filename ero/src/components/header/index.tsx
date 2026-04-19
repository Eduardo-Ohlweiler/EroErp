import { useNavigate } from "react-router-dom"
import { useTheme }    from "../../hooks/useTheme"
import { useAuth }     from "../../hooks/useAuth"
import { TDropdown }   from "../tdropdown"
import { FaUser, FaPenToSquare, FaRightFromBracket } from "react-icons/fa6"

interface Props {
  toggleMenu: () => void
}

export default function Header({ toggleMenu }: Props) {
  const { theme, toggleTheme } = useTheme()
  const { user, logout }       = useAuth()
  const navigate               = useNavigate()

  function handleLogout() {
    logout()
    navigate("/login")
  }

  return (
    <header className="h-14 flex items-center justify-between px-4
      bg-(--bg-header) border-b border-(--border-strong)">

      <div className="flex items-center gap-4">
        <button
          onClick={toggleMenu}
          className="text-(--text-sidebar) hover:text-(--text-inverse) transition text-lg"
        >
          ☰
        </button>
        <h1 className="text-lg font-semibold text-(--text-inverse)">
          EroErp
        </h1>
      </div>

      <div className="flex items-center gap-2">

        {/* toggle tema */}
        <button
          onClick={toggleTheme}
          className="text-(--text-sidebar) hover:text-(--text-inverse) transition px-2"
          title={theme === "dark" ? "Tema claro" : "Tema escuro"}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

        {/* menu do usuário */}
        <TDropdown
          icon    ={<FaUser size={16} />}
          align   ="right"
          options ={[
            {
              label:   user?.nome ?? "Usuário",
              icon:    null,
              onClick: () => {}
            },
            {
              label:   "Editar perfil",
              icon:    <FaPenToSquare size={14} />,
              onClick: () => navigate("/perfil"),
              divider: true
            },
            {
              label:   "Sair",
              icon:    <FaRightFromBracket size={14} />,
              onClick: handleLogout,
              divider: true
            }
          ]}
        />

      </div>

    </header>
  )
}