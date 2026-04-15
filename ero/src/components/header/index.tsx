interface Props {
  toggleMenu: () => void
}

export default function Header({ toggleMenu }: Props) {

  return (
    <header className="h-17.5 flex items-center px-4 bg-[#0e1116] border-b border-[#30363d]">

      <button
        onClick={toggleMenu}
        className="text-gray-400 hover:text-white text-lg"
      >
        ☰
      </button>

      <h1 className="ml-4 text-lg text-gray-300">
        EroErp
      </h1>

    </header>
  )
}