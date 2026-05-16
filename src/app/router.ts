import { createRouter, createWebHistory } from "vue-router"
import { useAuthStore } from "@/features/auth/store.ts"
import { useUser } from "@/features/user/store.ts"

import Auth        from "@/features/auth/Auth.vue"
import MyQuiz      from "@/features/quiz/myQuiz/MyQuiz.vue"
import AllQuiz     from "@/features/quiz/allQuiz/AllQuiz.vue"
import CreateQuiz  from "@/features/quiz/shared/CreateQuiz.vue"
import QuizInfo    from "@/features/quiz/shared/QuizInfo.vue"
import ProfilePage from "@/pages/ProfilePage/ProfilePage.vue"

const router = createRouter({
    history: createWebHistory(),
    routes: [
        // ── Public ──────────────────────────────────────────────────────────────
        {
            path: "/auth",
            name: "auth",
            component: Auth,
            meta: { public: true },
        },

        // ── Redirect root ────────────────────────────────────────────────────────
        {
            path: "/",
            redirect: "/my-quizzes",
        },

        // ── Creator routes ───────────────────────────────────────────────────────
        {
            path: "/my-quizzes",
            name: "my-quizzes",
            component: MyQuiz,
            meta: { requiresAuth: true, requiresCreator: true },
        },
        {
            path: "/quiz/create",
            name: "quiz-create",
            component: CreateQuiz,
            meta: { requiresAuth: true, requiresCreator: true },
        },
        {
            path: "/quiz/:quiz_id",
            name: "quiz-info",
            component: QuizInfo,
            props: route => ({ quiz_id: Number(route.params.quiz_id) }),
            meta: { requiresAuth: true, requiresCreator: true },
        },

        // ── Admin routes ─────────────────────────────────────────────────────────
        {
            path: "/all-quizzes",
            name: "all-quizzes",
            component: AllQuiz,
            meta: { requiresAuth: true, requiresAdmin: true },
        },

        // ── Profile ──────────────────────────────────────────────────────────────
        {
            path: "/profile",
            name: "profile",
            component: ProfilePage,
            meta: { requiresAuth: true },
        },

        // ── Fallback ─────────────────────────────────────────────────────────────
        {
            path: "/:pathMatch(.*)*",
            redirect: "/my-quizzes",
        },
    ],
})

// ── Navigation guard ─────────────────────────────────────────────────────────
router.beforeEach((to) => {
    const auth = useAuthStore()
    const user = useUser()

    // Публичные маршруты — пропускаем
    if (to.meta.public) return true

    // Не авторизован — на /auth
    if (to.meta.requiresAuth && !auth.isAuthenticated) {
        return { name: "auth" }
    }


    // Нужна роль admin
    if (to.meta.requiresAdmin && !user.isAdmin) {
        return { name: "my-quizzes" }
    }

    return true
})

export default router