interface TButtonProps {
  label: string
  onClick?: () => void
  type?: "button" | "submit" | "reset"
  variant?: "primary" | "secondary" | "danger" | "success"
  icon?: React.ReactNode
  disabled?: boolean
  loading?: boolean
}

const variants = {
  primary:   "bg-blue-600 hover:bg-blue-700 text-white",
  secondary: "border border-[#30363d] text-[#9da5b4] hover:bg-[#2a313a] hover:text-white",
  danger:    "bg-red-600 hover:bg-red-700 text-white",
  success:   "bg-green-600 hover:bg-green-700 text-white",
}

export function TButton({
  label,
  onClick,
  type = "button",
  variant = "primary",
  icon,
  disabled,
  loading
}: TButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition
      ${variants[variant]}
      disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {loading
        ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        : icon
      }
      {label}
    </button>
  )
}