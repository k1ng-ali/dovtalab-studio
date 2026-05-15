import {http} from "@/shared/api/http.ts";
import type {QuestionIn, QuestionOut, QuizIn, QuizOut, QuizUpdateOut} from "@/features/quiz/types.ts";

export const allQuizzes = () => http.get<QuizIn[]>('/quizzes/')

export const getQuiz = (quiz_id: number) => http.get<QuizIn>(`/quizzes/${quiz_id}`)

export const createQuiz = (quiz: QuizOut) => http.post<QuizIn>('/quizzes/', quiz)

export const updateQuiz = (quiz: QuizUpdateOut) => http.patch(`/quizzes/${quiz.id}`, quiz)

export const deleteQuiz = (quiz_id: number) => http.delete(`/quizzes/${quiz_id}`)


// Добавь эти функции в свой существующий api.ts файл
// Получить вопросы викторины
export const getQuestions = (quiz_id: number) =>
    http.get<QuestionIn[]>(`/quizzes/${quiz_id}/questions`);

// Создать вопрос
export const createQuestion = (data: QuestionOut) =>
    http.post<QuestionIn>(`/questions/`, data);

// Обновить вопрос
export const updateQuestion = (question_id: number, data: Partial<QuestionOut>) =>
    http.patch<QuestionIn>(`/questions/${question_id}`, data);

// Удалить вопрос
export const deleteQuestion = (question_id: number) =>
    http.delete(`/questions/${question_id}`);

// Загрузка изображения — возвращает { url: string }
export const uploadImage = (formData: FormData, question_id: number) =>
    http.post<QuestionIn>(`/questions/upload-image/${question_id}`, formData)

import type { ContextIn, ContextCreateOut, ContextUpdateOut } from "@/features/quiz/types"

// GET /quizzes/{quiz_id}/contexts
export const getContexts = (quiz_id: number) =>
    http.get<ContextIn[]>(`/quizzes/${quiz_id}/contexts`)

// POST /quizzes/{quiz_id}/contexts
export const createContext = (context: ContextCreateOut) =>
    http.post<ContextIn>(`/quizzes/${context.quiz_id}/contexts`, context)

// PATCH /contexts/{id}
export const updateContext = (context: ContextUpdateOut) =>
    http.patch<ContextIn>(`/contexts/${context.id}`, context)

// DELETE /contexts/{id}
export const deleteContext = (id: number) =>
    http.delete(`/contexts/${id}`)