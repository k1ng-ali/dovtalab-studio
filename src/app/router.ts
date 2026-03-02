import QuizInfo from "@/features/quiz/components/QuizInfo.vue";
import QuizQuestions from "@/features/quiz/components/QuizQuestions.vue";
import { createRouter, createWebHistory } from "vue-router";
import Dashboard from "@/pages/Dashboard.vue";
import Authorization from "@/features/auth/components/authorization.vue";
import MyQuiz from "@/features/quiz/components/MyQuiz.vue";
import AllQuiz from "@/features/quiz/components/AllQuiz.vue";
import CreateQuiz from "@/features/quiz/components/CreateQuiz.vue";

const router = createRouter({
        history: createWebHistory(),
        routes: [
            {path: "/", component: Dashboard},
            {path: "/auth", component: Authorization},
            {path: "/my-quizzes/", component: MyQuiz},
            {path: "/all-quizzes/", component: AllQuiz},
            {path: "/create-quiz", component: CreateQuiz},
            {
                path: "/quiz-info/:quiz_id",
                name: "quiz info",
                component: QuizInfo,
                props: route => ({ quiz_id: Number(route.params.quiz_id) }),
            },
            {
                // Страница управления вопросами викторины
                path: "/quiz/:quiz_id/questions",
                name: "quiz questions",
                component: QuizQuestions,
                props: route => ({ quiz_id: Number(route.params.quiz_id) }),
            },
        ]
    }
)

export default router