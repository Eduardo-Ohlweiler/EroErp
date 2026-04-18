export type MessageType = "success" | "error" | "warning" | "info"

export interface Message {
  id: number
  type: MessageType
  text: string
}