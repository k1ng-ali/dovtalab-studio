import { defineStore } from "pinia"
import * as api from "./api"
import type { User, Config, UserRole, UserProfile } from "@/features/user/types.ts"

export const useUser = defineStore("user", {
    state: () => ({
        user:   null as User | null,
        config: null as Config | null,
        roles:  [] as UserRole[],
    }),

    getters: {
        isAuthenticated: (state) => !!state.user,

        full_name: (state) =>
            state.user
                ? `${state.user.first_name}${state.user.last_name ? " " + state.user.last_name : ""}`
                : "",

        isCreator: (state) => state.roles.includes("creator"),

        // Администратор — видит /all-quizzes и другие расширенные маршруты
        isAdmin: (state) => state.roles.includes("admin"),
    },

    actions: {
        async fetchMe() {
            const { data } = await api.getMe()
            this.user = data
        },

        async fetchConfig() {
            if (this.config) return this.config
            try {
                const { data } = await api.config()
                this.config = data as Config
                return data as Config
            } catch (error) {
                console.error(error)
            }
        },

        async fetchProfile() {
            try {
                const { data } = await api.profile()
                const profile = data as UserProfile
                this.user   = profile.user
                this.config = profile.config
                this.roles  = profile.roles
                console.log(data)
            } catch (error) {
                console.error(error)
            }
        },

        async clean() {
            this.user   = null
            this.config = null
            this.roles  = []
        },
    },
})