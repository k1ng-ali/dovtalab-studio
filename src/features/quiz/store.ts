import { defineStore } from "pinia";
import * as api from "./api";
import type {
    QuizIn, QuizOut, QuizUpdateOut,
    QuestionOut, QuestionIn,
    ContextIn, ContextCreateOut, ContextUpdateOut,
} from "@/features/quiz/types";

export const useQuiz = defineStore("quiz", {
    state: () => ({
        quizzes:  [] as QuizIn[],
        questions: [] as QuestionIn[],
        contexts:  [] as ContextIn[],
    }),

    getters: {
        all_quizzes: (state): QuizIn[] => state.quizzes,

        quiz: (state) => (id: number): QuizIn | null =>
            state.quizzes.find(q => q.id === id) ?? null,

        questionsByQuiz: (state) => (quiz_id: number): QuestionIn[] =>
            state.questions.filter(q => (q as any).quiz_id === quiz_id),

        contextsByQuiz: (state) => (quiz_id: number): ContextIn[] =>
            state.contexts.filter(c => (c as any).quiz_id === quiz_id),
    },

    actions: {
        // ─── Quiz ────────────────────────────────────────────────────────────
        async fetchQuizzes() {
            const { data } = await api.myQuizzes();
            this.quizzes = data;
        },

        async fetchQuiz(quiz_id: number) {
            const { data } = await api.getQuiz(quiz_id);
            return data;
        },

        async uploadQuiz(quiz_out: QuizOut) {
            const { data } = await api.createQuiz(quiz_out);
            return data;
        },

        async updateQuiz(quiz_out: QuizUpdateOut) {
            const { data } = await api.updateQuiz(quiz_out);
            return data;
        },

        async deleteQuiz(quiz_id: number) {
            const data = await api.deleteQuiz(quiz_id);
            return data.status
        },

        // ─── Contexts ────────────────────────────────────────────────────────
        async fetchContexts(quiz_id: number): Promise<ContextIn[]> {
            const { data } = await api.getContexts(quiz_id);
            this.contexts = data;
            return data;
        },

        async createContext(context_out: ContextCreateOut): Promise<ContextIn> {
            const { data } = await api.createContext(context_out);
            //this.contexts.push(data);
            return data;
        },

        async updateContext(context_out: ContextUpdateOut): Promise<ContextIn> {
            const { data } = await api.updateContext(context_out);
            //const idx = this.contexts.findIndex(c => c.id === context_out.id);
            //if (idx !== -1) this.contexts[idx] = data;
            return data;
        },

        async deleteContext(context_id: number): Promise<void> {
            await api.deleteContext(context_id);
            this.contexts = this.contexts.filter(c => c.id !== context_id);
        },

        // ─── Questions ───────────────────────────────────────────────────────
        async fetchQuestions(quiz_id: number): Promise<QuestionIn[]> {
            const { data } = await api.getQuestions(quiz_id);
            this.questions = data;
            return data;
        },

        // стало:
        async createQuestion(question_out: QuestionOut): Promise<QuestionIn> {
            const { data } = await api.createQuestion(question_out);
            //this.questions.push(data);  // ← добавляем в стор
            return data;
        },

        async updateQuestion(question_id: number, question_out: Partial<QuestionOut>): Promise<QuestionIn> {
            const { data } = await api.updateQuestion(question_id, question_out);
            //const idx = this.questions.findIndex(q => q.id === question_id);
            //if (idx !== -1) this.questions[idx] = data;
            return data;
        },

        async deleteQuestion(question_id: number): Promise<void> {
            await api.deleteQuestion(question_id);
            this.questions = this.questions.filter(q => q.id !== question_id);
        },

        async uploadImage(file: FormData, question_id: number) {
            const { data } = await api.uploadImage(file, question_id);
            return data.image_url;
        },
    },
});