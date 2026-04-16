import { useTheme } from "../../hooks/useTheme"

interface Props {
  toggleMenu: () => void
}

export default function Header({ toggleMenu }: Props) {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="h-17.5 flex items-center justify-between px-4 bg-[var(--bg-header)] border-b border-[var(--border-strong)]">

      <div className="flex items-center gap-4">
        <button
          onClick={toggleMenu}
          className="text-[var(--text-sidebar)] hover:text-[var(--text-inverse)] transition text-lg"
        >
          ☰
        </button>
        <h1 className="text-lg font-semibold text-[var(--text-inverse)]">
          EroErp
        </h1>
      </div>

      <button
        onClick={toggleTheme}
        className="text-[var(--text-sidebar)] hover:text-[var(--text-inverse)] transition text-lg px-2"
        title={theme === "dark" ? "Tema claro" : "Tema escuro"}
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>

    </header>
  )
}