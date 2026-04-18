import { createContext } from "react"
import type { QuestionButton } from "../types/TQuestion"

interface TQuestionContextData {
    ask: (message: string, buttons: QuestionButton[]) => void
}

export const TQuestionContext = createContext<TQuestionContextData>({} as TQuestionContextData)