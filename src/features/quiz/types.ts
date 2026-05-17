// ─── Quiz ────────────────────────────────────────────────────────────────────

export interface QuizOut {
    title: string
    description: string
    time_limit: number
}

export interface QuizUpdateOut extends QuizOut {
    id: number
}

export interface ContextIn {
    id: number
    title: string
    text: string
    rule?: string
    order: number
    detail?: {
        questions: number
    }
}

// ─── Context request types ────────────────────────────────────────────────────

export interface ContextCreateOut {
    quiz_id: number
    title: string
    text: string
    rule?: string
    order: number
}

export interface ContextUpdateOut {
    id: number
    title?: string
    text?: string
    rule?: string
}

// ─── Quiz response ────────────────────────────────────────────────────────────

export interface QuizIn {
    id: number
    hash_code: string
    title: string
    description: string
    time_limit: number
    contexts?: ContextIn[]
    created_at: string
    details?: {
        type: "single_choice" | "multiple_choice" | "matching" | "input"
        total: number
        completed: number
    }
}

// ─── Question payload types ───────────────────────────────────────────────────

export interface QuestionOption {
    id: number
    text: string
    explanation?: string
    image_url?: string
}

export interface MatchItem {
    id: number
    text: string
}

export interface InputAnswer {
    value: string
    aliases: string[]
}

export interface SingleChoicePayload {
    options: QuestionOption[]
    correct: number
    shuffle: boolean
}

export interface MultipleChoicePayload {
    options: QuestionOption[]
    correct: number[]
    min_choices: number
    max_choices: number
    shuffle: boolean
    partial_scoring: boolean
}

export interface MatchingPayload {
    left: MatchItem[]
    right: MatchItem[]
    /** key = left.id, value = right.id */
    pairs: Record<string, number>
    shuffle_left: boolean
    shuffle_right: boolean
}

export interface InputPayload {
    answers: InputAnswer[]
    case_sensitive: boolean
    trim: boolean
    normalize_space: boolean
    numeric: boolean
    tolerance: number
}

export type QuestionType = "single_choice" | "multiple_choice" | "matching" | "input"

export interface QuestionPayload {
    single_choice?: SingleChoicePayload
    multiple_choice?: MultipleChoicePayload
    matching?: MatchingPayload
    input?: InputPayload
}

// ─── Question Out (request) ───────────────────────────────────────────────────

export interface QuestionOut {
    id?: number
    text: string
    type: QuestionType
    context_id?: number | null
    image_key?: string | null
    payload: QuestionPayload
    order: number
    quiz_id: number
}

// ─── Question In (response) ───────────────────────────────────────────────────

export interface QuestionIn {
    id: number
    text: string
    type: QuestionType
    context_id?: number | null
    image_url?: string
    payload: QuestionPayload
    order: number
}