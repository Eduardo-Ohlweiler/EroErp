export interface QuestionButton {
    label:    string
    variant?: "primary" | "secondary" | "danger" | "success" | "cancel" | "confirm" | "block" | "unblock" | "new" | "delete" | "edit" | "save"
    onClick:  () => void
}