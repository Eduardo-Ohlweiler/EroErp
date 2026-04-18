import { useState, useCallback } from "react"
import { TMessageContext } from "./TMessageContext"
import type { Message, MessageType } from "../types/TMessage"

const icons = {
  success: "✓",
  error:   "✕",
  warning: "⚠",
  info:    "ℹ",
}

const styles = {
  success: {
    bar:  "bg-[var(--success)]",
    icon: "bg-[var(--success)] text-white",
    text: "text-[var(--success)]",
  },
  error: {
    bar:  "bg-[var(--danger)]",
    icon: "bg-[var(--danger)] text-white",
    text: "text-[var(--danger)]",
  },
  warning: {
    bar:  "bg-[var(--warning)]",
    icon: "bg-[var(--warning)] text-white",
    text: "text-[var(--warning)]",
  },
  info: {
    bar:  "bg-[var(--accent)]",
    icon: "bg-[var(--accent)] text-white",
    text: "text-[var(--accent)]",
  },
}

export function TMessageProvider({ children }: { children: React.ReactNode }) {

  const [messages, setMessages] = useState<Message[]>([])

  const showMessage = useCallback((type: MessageType, text: string) => {
    const id = Date.now()
    setMessages((prev) => [...prev, { id, type, text }])
  }, [])

  function remove(id: number) {
    setMessages((prev) => prev.filter((m) => m.id !== id))
  }

  return (
    <TMessageContext.Provider value={{ showMessage }}>
      {children}

      <div className="fixed top-5 right-5 flex flex-col gap-3 z-9999">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className="flex items-stretch bg-(--bg-surface) border border-(--border)
            rounded-lg shadow-xl overflow-hidden min-w-[320px] max-w-420px"
          >
            <div className={`w-1 shrink-0 ${styles[msg.type].bar}`} />

            <div className={`flex items-center justify-center w-10 shrink-0 ${styles[msg.type].icon}`}>
              <span className="text-base font-bold">{icons[msg.type]}</span>
            </div>

            <div className="flex-1 px-4 py-3 flex flex-col gap-2">
              <p className={`text-sm font-medium ${styles[msg.type].text}`}>
                {msg.type.charAt(0).toUpperCase() + msg.type.slice(1)}
              </p>
              <p className="text-sm text-(--text-secondary)">{msg.text}</p>

              <div className="flex justify-end">
                <button
                  onClick={() => remove(msg.id)}
                  className="px-4 py-1 text-xs rounded-md border border-(--border)
                  text-(--text-secondary) hover:bg-(--bg-hover)
                  hover:text-(--text-primary) transition"
                >
                  OK
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

    </TMessageContext.Provider>
  )
}