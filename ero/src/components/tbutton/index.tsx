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
  primary:   "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--text-inverse)]",
  secondary: "border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]",
  danger:    "bg-[var(--danger)] hover:bg-[var(--danger-hover)] text-[var(--text-inverse)]",
  success:   "bg-[var(--success)] hover:bg-[var(--success-hover)] text-[var(--text-inverse)]",
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