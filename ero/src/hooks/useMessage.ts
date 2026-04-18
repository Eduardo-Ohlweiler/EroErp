import { useContext } from "react"
import { TMessageContext } from "../contexts/TMessageContext"

export function useMessage() {
  return useContext(TMessageContext)
}