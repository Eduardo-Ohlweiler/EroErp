import { createContext } from "react"
import type { MessageType } from "../types/TMessage"

interface TMessageContextData {
  showMessage: (type: MessageType, text: string) => void
}

export const TMessageContext = createContext<TMessageContextData>({} as TMessageContextData)