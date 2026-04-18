import { useContext } from "react"
import { TQuestionContext } from "../contexts/TQuestionContext"

export function useQuestion() {
    return useContext(TQuestionContext)
}