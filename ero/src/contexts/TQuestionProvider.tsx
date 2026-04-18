import { useState, useCallback } from "react"
import { TQuestionContext } from "./TQuestionContext"
import { TButton } from "../components/tbutton"
import type { QuestionButton } from "../types/TQuestion"

interface Question {
    message: string
    buttons: QuestionButton[]
}

export function TQuestionProvider({ children }: { children: React.ReactNode }) {

    const [question, setQuestion] = useState<Question | null>(null)

    const ask = useCallback((message: string, buttons: QuestionButton[]) => {
        setQuestion({ message, buttons })
    }, [])

    function handleClick(btn: QuestionButton) {
        btn.onClick()
        setQuestion(null)
    }

    return (
        <TQuestionContext.Provider value={{ ask }}>
        {children}

        {question && (
            <>
            <div className="fixed inset-0 bg-black/50 z-9998" />

            <div className="fixed inset-0 flex items-center justify-center z-9999">
                <div className="bg-(--bg-surface) border border-(--border) rounded-lg shadow-2xl
                        p-6 w-400px flex flex-col gap-6">

                <div className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5">❓</span>
                    <p className="text-sm text-(--text-primary) leading-relaxed">
                    {question.message}
                    </p>
                </div>

                <div className="flex justify-end gap-2">
                    {question.buttons.map((btn, index) => (
                    <TButton
                        key     ={index}
                        label   ={btn.label}
                        variant ={btn.variant ?? "primary"}
                        onClick ={() => handleClick(btn)}
                    />
                    ))}
                </div>

                </div>
            </div>
            </>
        )}

        </TQuestionContext.Provider>
    )
}