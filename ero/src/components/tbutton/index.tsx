import {
  FaFloppyDisk,
  FaBan,
  FaPlus,
  FaTrash,
  FaPenToSquare,
  FaCheck,
  FaXmark,
  FaLockOpen
} from "react-icons/fa6"

interface TButtonProps {
  label:     string
  onClick?:  (e?: React.MouseEvent<HTMLButtonElement>) => void
  type?:     "button"    | "submit"    | "reset"
  variant?:  "primary"   | "secondary" | "danger"  | "success"
           | "save"      | "new"       | "delete"  | "block"
           | "unblock"   | "edit"      | "confirm" | "cancel"
  icon?:     React.ReactNode
  disabled?: boolean
  loading?:  boolean
  width?:    string
  height?:   string
  form?:     string
}

const variantConfig: Record<string, { classes: string; defaultIcon: React.ReactNode }> = {
  primary:   { classes: "bg-[var(--accent)]   hover:bg-[var(--accent-hover)]  text-[var(--text-inverse)]",                                                          defaultIcon: null },
  secondary: { classes: "border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]",                   defaultIcon: null },
  danger:    { classes: "bg-[var(--danger)]   hover:bg-[var(--danger-hover)]  text-[var(--text-inverse)]",                                                          defaultIcon: null },
  success:   { classes: "bg-[var(--success)]  hover:bg-[var(--success-hover)] text-[var(--text-inverse)]",                                                          defaultIcon: null },
  save:      { classes: "bg-[var(--success)]  hover:bg-[var(--success-hover)] text-[var(--text-inverse)]",                                                          defaultIcon: <FaFloppyDisk size={13} /> },
  new:       { classes: "bg-[var(--accent)]   hover:bg-[var(--accent-hover)]  text-[var(--text-inverse)]",                                                          defaultIcon: <FaPlus size={13} /> },
  delete:    { classes: "bg-[var(--danger)]   hover:bg-[var(--danger-hover)]  text-[var(--text-inverse)]",                                                          defaultIcon: <FaTrash size={13} /> },
  block:     { classes: "bg-[var(--danger)]   hover:bg-[var(--danger-hover)]  text-[var(--text-inverse)]",                                                          defaultIcon: <FaBan size={13} /> },
  unblock:   { classes: "bg-[var(--success)]  hover:bg-[var(--success-hover)] text-[var(--text-inverse)]",                                                          defaultIcon: <FaLockOpen size={13} /> },
  edit:      { classes: "bg-[var(--accent)]   hover:bg-[var(--accent-hover)]  text-[var(--text-inverse)]",                                                          defaultIcon: <FaPenToSquare size={13} /> },
  confirm:   { classes: "bg-[var(--success)]  hover:bg-[var(--success-hover)] text-[var(--text-inverse)]",                                                          defaultIcon: <FaCheck size={13} /> },
  cancel:    { classes: "border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]",                   defaultIcon: <FaXmark size={13} /> },
}

export function TButton({
  label,
  onClick,
  type    = "button",
  variant = "primary",
  icon,
  disabled,
  loading,
  width,
  height,
  form
}: TButtonProps) {

  const config            = variantConfig[variant] ?? variantConfig.primary
  const iconToShow        = icon ?? config.defaultIcon
  const DEFAULT_HEIGHT    = "35px"
  const DEFAULT_PADDING_X = "12px"

  return (
    <button
      type={type}
      form={form}
      onClick={(e) => onClick?.(e)}
      disabled={disabled || loading}
      style={{
        width:         width  ??  "auto",
        height:        height ??  DEFAULT_HEIGHT,
        paddingInline: width  ?   undefined : DEFAULT_PADDING_X,
      }}
      className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition
        ${config.classes}
        disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {loading
        ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        : iconToShow
      }
      {label}
    </button>
  )
}